import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import TrackInfo, { ITrack } from './models/Track';
import { planRoute, extractProvince, extractDistrictHub, solveTSP, getDrivingRoute, generateLine } from './utils/geoService';

const app = express();
const PORT = 3003;

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://lxy:123lxy@47.109.143.184:27017/logistics')
    .then(() => console.log('✅ MongoDB 连接成功'))
    .catch(err => console.error('❌ MongoDB 连接失败:', err));

const activeSimulations = new Map<string, NodeJS.Timeout>();
const connectedClients = new Set<WebSocket>();
const dispatchingHubs = new Set<string>();

const broadcast = (data: any) => {
    connectedClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
};

// --- 🚚 仿真引擎 ---
const startSimulation = (track: ITrack) => {
    // 1. 清理旧定时器，防止多重驱动
    if (activeSimulations.has(track.id)) {
        clearInterval(activeSimulations.get(track.id));
        activeSimulations.delete(track.id);
    }

    // 等待状态不跑
    if (track.logisticsStatus === 'waiting_for_delivery') return;

    // 深拷贝路径
    const path = JSON.parse(JSON.stringify(track.path));
    const totalSteps = path.length;
    const processedStops = new Set<string>();

    // 2. 🟢 [核心修复] 智能断点续传
    let index = 0;
    if (track.currentCoords && track.currentCoords.length === 2) {
        let minD = Infinity;
        let foundIndex = 0;

        // 遍历寻找最近的点
        for (let i = 0; i < path.length; i++) {
            const p = path[i];
            const d = Math.sqrt(Math.pow(p[0] - track.currentCoords[0], 2) + Math.pow(p[1] - track.currentCoords[1], 2));
            if (d < minD) {
                minD = d;
                foundIndex = i;
            }
        }

        index = foundIndex;

        // 🟢 [保底逻辑]：
        // 如果状态是 delivering (派送中)，但计算出的 index 已经是终点了，说明匹配错误（可能匹配到了重叠路径的末尾）
        // 此时强制重置为 0，让小车从头开始跑，确保用户能看到过程，而不是卡在终点
        if (track.logisticsStatus === 'delivering' && index >= totalSteps - 5) {
            console.log(`[仿真修正] ${track.id} 派送中但进度已满，重置为起点`);
            index = 0;
        }
    }

    console.log(`[仿真启动] ${track.id} | 状态: ${track.logisticsStatus} | 进度: ${index}/${totalSteps}`);

    const timer = setInterval(async () => {
        // --- 1. 到达终点 ---
        if (index >= totalSteps) {
            clearInterval(timer);
            activeSimulations.delete(track.id);
            const finalPoint = path[totalSteps - 1];

            // 📍 阶段A: 到达站点
            if (track.logisticsStatus === 'shipped') {
                const now = new Date();
                const hubName = track.districtHub || "区域站点";
                const fullHubName = hubName.includes('区') ? hubName + "人民政府" : hubName;

                const log = {
                    time: now,
                    location: fullHubName,
                    description: `快件已到达【${fullHubName}】集散点，等待集货派送`,
                    status: 'waiting_for_delivery',
                    operator: '站点管理员'
                };

                await TrackInfo.findOneAndUpdate(
                    { id: track.id },
                    {
                        $set: {
                            logisticsStatus: 'waiting_for_delivery',
                            hubArrivalTime: now,
                            currentCoords: finalPoint
                        },
                        $push: { tracks: log }
                    }
                );
                broadcast({ type: 'STATUS_UPDATE', id: track.id, status: 'waiting_for_delivery', newLog: log });
                checkAndDispatch(track.districtHub);
            }
            // 📍 阶段B: 签收
            else if (track.logisticsStatus === 'delivering') {
                const log = {
                    time: new Date(),
                    location: track.userAddress, // 🟢 确保这里取的是具体的收货地址
                    description: `已在【${track.userAddress}】签收，感谢您的使用，期待您的再次使用`,
                    status: 'delivered',
                    operator: '快递员'
                };
                await TrackInfo.findOneAndUpdate(
                    { id: track.id },
                    {
                        $set: { logisticsStatus: 'delivered', currentCoords: finalPoint },
                        $push: { tracks: log }
                    }
                );
                broadcast({ type: 'STATUS_UPDATE', id: track.id, status: 'delivered', newLog: log });
                console.log(`[签收] ${track.id} 结束`);
            }
            return;
        }

        // --- 2. 检测中转站 ---
        if (track.logisticsStatus === 'shipped' && track.transitStops && track.transitStops.length > 0) {
            const stop = track.transitStops.find(s => Math.abs(s.stepIndex - index) <= 3);
            if (stop && !processedStops.has(stop.hubName)) {
                const currentDoc = await TrackInfo.findOne({ id: track.id });
                if (!currentDoc?.tracks.some(t => t.location === stop.hubName)) {
                    const hubLog = {
                        time: new Date(),
                        location: stop.hubName,
                        description: `快件已到达【${stop.hubName}】，正发往下一站`,
                        status: 'shipped',
                        operator: '转运中心'
                    };
                    await TrackInfo.updateOne({ id: track.id }, { $push: { tracks: hubLog } });
                    broadcast({ type: 'LOG_UPDATE', id: track.id, newLog: hubLog });
                }
                processedStops.add(stop.hubName);
            }
        }

        // --- 3. 移动 ---
        const currentPos = path[index];
        if (index % 5 === 0) {
            await TrackInfo.updateOne({ id: track.id }, { $set: { currentCoords: currentPos } });
        }
        broadcast({ type: 'LOCATION_UPDATE', id: track.id, position: currentPos });
        index++;

    }, 1000); // 1秒1步

    activeSimulations.set(track.id, timer);
};

// --- 🧠 调度器 ---
const checkAndDispatch = async (hubName: string) => {
    if (dispatchingHubs.has(hubName)) return;

    const orders = await TrackInfo.find({
        districtHub: hubName,
        logisticsStatus: 'waiting_for_delivery'
    });
    if (orders.length === 0) return;

    const now = Date.now();
    const TIMEOUT_THRESHOLD = 60 * 60 * 1000;
    // const TIMEOUT_THRESHOLD = 10 * 1000; // 测试用

    const isFull = orders.length >= 5;
    const isTimeout = orders.some(o => o.hubArrivalTime && (now - new Date(o.hubArrivalTime).getTime() > TIMEOUT_THRESHOLD));

    if (isFull || isTimeout) {
        console.log(`[调度] ${hubName} 触发派送 (${orders.length}单)`);
        dispatchingHubs.add(hubName);
        try {
            await dispatchBatch(hubName, orders);
        } finally {
            setTimeout(() => { dispatchingHubs.delete(hubName); }, 5000);
        }
    }
};

const dispatchBatch = async (hubName: string, orders: ITrack[]) => {
    const startCoords: [number, number] = [orders[0].currentCoords[0], orders[0].currentCoords[1]];
    const destinations = orders.map(o => ({ id: o.id, coords: [o.endCoords[0], o.endCoords[1]] as [number, number] }));

    const sortedOrderIds = await solveTSP(startCoords, destinations);
    console.log(`[TSP] 顺序: ${sortedOrderIds.join(' -> ')}`);

    let accumulatedSegment: number[][] = [];
    let prevCoords = startCoords;

    const updatesToApply: Array<{ id: string, fullPath: number[][], log: any }> = [];

    for (const orderId of sortedOrderIds) {
        let currentOrderCoords: [number, number] | null = null;

        try {
            const order = orders.find(o => o.id === orderId)!;
            const trunkPath = order.path;
            const targetCoords: [number, number] = [order.endCoords[0], order.endCoords[1]];
            currentOrderCoords = targetCoords;

            await new Promise(resolve => setTimeout(resolve, 1500));

            console.log(`[派送规划] ${orderId} : ${prevCoords} -> ${targetCoords}`);

            let newSegment = await getDrivingRoute(prevCoords, targetCoords);

            // 保底
            if (!newSegment || newSegment.length < 2) {
                newSegment = generateLine(prevCoords, targetCoords, 50);
            }

            // 🟢 [核心修改] 只对新增的一小段路抽稀，不要抽稀累积路径！
            // 这样保证前面的路径细节不会丢失，长度也是严格递增的
            const thinnedNewSegment = newSegment.filter((_, i) => i % 2 === 0);

            // 累加
            accumulatedSegment = [...accumulatedSegment, ...thinnedNewSegment];

            // 拼接：干线 + 派送线
            const fullPath = [...trunkPath, ...accumulatedSegment];

            console.log(`[${orderId}] 路径总长: ${fullPath.length}`);

            const log = {
                time: new Date(),
                location: hubName,
                description: `调度完成，快递员已从【${hubName}人民政府】出发，开始派送`,
                status: 'delivering',
                operator: '调度系统'
            };

            updatesToApply.push({ id: orderId, fullPath, log });

        } catch (err) {
            console.error(`[派送错误] ${orderId}`, err);
            // 容错：加直线
            if (currentOrderCoords) accumulatedSegment.push(currentOrderCoords);
        } finally {
            if (currentOrderCoords) prevCoords = currentOrderCoords;
        }
    }

    // 批量更新数据库
    console.log(`[派送] 批量更新 ${updatesToApply.length} 个订单`);
    for (const update of updatesToApply) {
        await TrackInfo.updateOne(
            { id: update.id },
            {
                $set: {
                    logisticsStatus: 'delivering',
                    path: update.fullPath,
                    currentCoords: startCoords
                },
                $push: { tracks: update.log }
            }
        );
        broadcast({ type: 'STATUS_UPDATE', id: update.id, status: 'delivering', newLog: update.log });
    }

    // 批量重启仿真
    setTimeout(async () => {
        for (const update of updatesToApply) {
            const o = await TrackInfo.findOne({ id: update.id });
            if (o) startSimulation(o);
        }
    }, 2000);
};

setInterval(async () => {
    const hubs = await TrackInfo.distinct('districtHub', { logisticsStatus: 'waiting_for_delivery' });
    hubs.forEach(h => checkAndDispatch(h));
}, 10000);

// --- API ---
app.post('/api/tracks/create', async (req, res) => {
    try {
        const body = req.body;
        const districtHub = extractDistrictHub(body.userAddress);
        const province = extractProvince(body.userAddress);
        const routeData = await planRoute(body.sendAddress, body.userAddress, true);

        let targetName = districtHub;
        if (routeData.transitStops && routeData.transitStops.length > 0) {
            targetName = routeData.transitStops[0].hubName;
        }

        const newTrack = new TrackInfo({
            ...body,
            id: body.id || `T-${Date.now()}`,
            orderId: body.orderId || `ORD-${Date.now()}`,
            province,
            districtHub,
            startCoords: routeData.startCoords,
            endCoords: routeData.endCoords,
            currentCoords: routeData.startCoords,
            path: routeData.path,
            transitStops: routeData.transitStops,
            logisticsStatus: 'shipped',
            tracks: [{
                time: new Date(),
                location: body.sendAddress,
                description: `商家已发货，正发往【${targetName}】`,
                status: 'shipped'
            }]
        });

        await newTrack.save();
        startSimulation(newTrack);
        res.json({ success: true, data: newTrack });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed' });
    }
});

app.get('/api/tracks/:id', async (req, res) => {
    const track = await TrackInfo.findOne({ id: req.params.id });
    if (track) {
        if (track.logisticsStatus === 'shipped' || track.logisticsStatus === 'delivering') {
            startSimulation(track);
        }
        res.json({ success: true, data: track });
    } else {
        res.status(404).json({ success: false });
    }
});

app.get('/api/stats/density', async (req, res) => {
    const stats = await TrackInfo.aggregate([{ $group: { _id: "$province", value: { $sum: 1 } } }]);
    res.json(stats.map(s => ({ name: s._id, value: s.value })));
});

const server = app.listen(PORT, () => {
    console.log(`🚀 后端运行中: http://localhost:${PORT}`);
});

const wss = new WebSocketServer({ server });
wss.on('connection', (ws) => connectedClients.add(ws));