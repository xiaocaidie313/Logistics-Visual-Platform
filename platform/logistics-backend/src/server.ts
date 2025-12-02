import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import TrackInfo, { ITrack } from './models/Track';
import { planRoute, extractProvince, extractDistrictHub, extractCity, solveTSP, getDrivingRoute, generateLine } from './utils/geoService';

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
    if (activeSimulations.has(track.id)) {
        clearInterval(activeSimulations.get(track.id));
        activeSimulations.delete(track.id);
    }

    if (track.logisticsStatus === 'waiting_for_delivery') return;

    const path = JSON.parse(JSON.stringify(track.path));
    const totalSteps = path.length;
    const processedStops = new Set<string>();

    let index = 0;
    if (track.currentCoords && track.currentCoords.length === 2) {
        let minD = Infinity;
        let foundIndex = 0;
        for (let i = 0; i < path.length; i++) {
            const p = path[i];
            const d = Math.sqrt(Math.pow(p[0] - track.currentCoords[0], 2) + Math.pow(p[1] - track.currentCoords[1], 2));
            if (d < minD) { minD = d; foundIndex = i; }
        }
        index = foundIndex;
        if (track.logisticsStatus === 'delivering' && index >= totalSteps - 5) {
            index = 0;
        }
    }

    console.log(`[仿真] ${track.id} (${track.isSameCity ? '同城' : '跨城'}) | 状态: ${track.logisticsStatus} | 进度: ${index}/${totalSteps}`);

    const timer = setInterval(async () => {
        // --- 1. 到达终点 ---
        if (index >= totalSteps) {
            clearInterval(timer);
            activeSimulations.delete(track.id);
            const finalPoint = path[totalSteps - 1];

            // 🟢 [同城] 直接签收，不进站
            if (track.isSameCity && track.logisticsStatus === 'shipped') {
                const currentDoc = await TrackInfo.findOne({ id: track.id });
                const isAlreadyDelivered = currentDoc?.tracks.some(t => t.status === 'delivered');

                if (!isAlreadyDelivered) {
                    const log = {
                        time: new Date(),
                        location: track.userAddress,
                        description: `同城急送已送达【${track.userAddress}】，感谢您的使用`,
                        status: 'delivered',
                        operator: '同城骑手'
                    };
                    await TrackInfo.findOneAndUpdate(
                        { id: track.id },
                        {
                            $set: { logisticsStatus: 'delivered', currentCoords: finalPoint },
                            $push: { tracks: log }
                        }
                    );
                    broadcast({ type: 'STATUS_UPDATE', id: track.id, status: 'delivered', newLog: log });
                    console.log(`[同城签收] ${track.id}`);
                }
                return;
            }

            // 📍 跨城逻辑 A: 干线到达 -> 等待
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
                        $set: { logisticsStatus: 'waiting_for_delivery', hubArrivalTime: now, currentCoords: finalPoint },
                        $push: { tracks: log }
                    }
                );
                broadcast({ type: 'STATUS_UPDATE', id: track.id, status: 'waiting_for_delivery', newLog: log });
                checkAndDispatch(track.districtHub);
            }
            // 📍 跨城逻辑 B: 末端派送 -> 签收
            else if (track.logisticsStatus === 'delivering') {
                const currentDoc = await TrackInfo.findOne({ id: track.id });
                const isAlreadyDelivered = currentDoc?.tracks.some(t => t.status === 'delivered');

                if (!isAlreadyDelivered) {
                    const log = {
                        time: new Date(),
                        location: track.userAddress,
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
            }
            return;
        }

        // --- 2. 检测中转站 ---
        // 🟢 关键：如果是同城，强制跳过此逻辑！防止路过大桥时误触发
        if (!track.isSameCity && track.logisticsStatus === 'shipped' && track.transitStops && track.transitStops.length > 0) {
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

        const currentPos = path[index];
        if (index % 5 === 0) {
            await TrackInfo.updateOne({ id: track.id }, { $set: { currentCoords: currentPos } });
        }
        broadcast({ type: 'LOCATION_UPDATE', id: track.id, position: currentPos });
        index++;

    }, 1000);

    activeSimulations.set(track.id, timer);
};

// ... (checkAndDispatch, dispatchBatch 保持不变)
const checkAndDispatch = async (hubName: string) => {
    if (dispatchingHubs.has(hubName)) return;
    const orders = await TrackInfo.find({ districtHub: hubName, logisticsStatus: 'waiting_for_delivery' });
    if (orders.length === 0) return;

    const now = Date.now();
    const TIMEOUT_THRESHOLD = 10 * 60 * 1000;
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

            let newSegment = await getDrivingRoute(prevCoords, targetCoords);
            if (!newSegment || newSegment.length < 2) {
                newSegment = generateLine(prevCoords, targetCoords, 50);
            }

            accumulatedSegment = [...accumulatedSegment, ...newSegment];
            if (accumulatedSegment.length > 500) {
                accumulatedSegment = accumulatedSegment.filter((_, i) => i % 2 === 0);
            }

            const fullPath = [...trunkPath, ...accumulatedSegment];
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
            if (currentOrderCoords) accumulatedSegment.push(currentOrderCoords);
        } finally {
            if (currentOrderCoords) prevCoords = currentOrderCoords;
        }
    }

    for (const update of updatesToApply) {
        await TrackInfo.updateOne(
            { id: update.id },
            {
                $set: { logisticsStatus: 'delivering', path: update.fullPath, currentCoords: startCoords },
                $push: { tracks: update.log }
            }
        );
        broadcast({ type: 'STATUS_UPDATE', id: update.id, status: 'delivering', newLog: update.log });
    }

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

        // 🟢 1. 判断同城
        const startCity = extractCity(body.sendAddress);
        const endCity = extractCity(body.userAddress);
        // 使用 include 增加容错
        const isSameCity = startCity && endCity && (startCity.includes(endCity) || endCity.includes(startCity));

        // 🟢 2. 规划路线 (geoService 已处理直连)
        const routeData = await planRoute(body.sendAddress, body.userAddress, true);

        // 🟢 3. 动态文案
        let startDesc = "";
        if (isSameCity) {
            // 同城文案
            startDesc = `同城急送，快递员已揽件，正发往【${body.userAddress}】`;
        } else {
            // 跨城文案
            let targetName = districtHub;
            if (routeData.transitStops && routeData.transitStops.length > 0) {
                targetName = routeData.transitStops[0].hubName;
            }
            startDesc = `商家已发货，正发往【${targetName}】`;
        }

        const newTrack = new TrackInfo({
            ...body,
            id: body.id || `T-${Date.now()}`,
            orderId: body.orderId || `ORD-${Date.now()}`,
            province,
            districtHub,
            isSameCity, // 🟢 存入数据库
            startCoords: routeData.startCoords,
            endCoords: routeData.endCoords,
            currentCoords: routeData.startCoords,
            path: routeData.path,
            transitStops: routeData.transitStops,
            logisticsStatus: 'shipped',
            tracks: [{
                time: new Date(),
                location: body.sendAddress,
                description: startDesc,
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

// ... (GET 接口和其他部分保持不变)
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