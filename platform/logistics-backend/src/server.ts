import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import TrackInfo, { ITrack } from './models/Track';
import { planRoute, extractProvince, extractDistrictHub, solveTSP, getDrivingRoute } from './utils/geoService';

const app = express();
const PORT = 3003;

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://lxy:123lxy@47.109.143.184:27017/logistics')
    .then(() => console.log('✅ MongoDB 连接成功'))
    .catch(err => console.error('❌ MongoDB 连接失败:', err));

const activeSimulations = new Map<string, NodeJS.Timeout>();
const connectedClients = new Set<WebSocket>();

const broadcast = (data: any) => {
    connectedClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
};

// --- 🚚 仿真引擎 ---
const startSimulation = (track: ITrack) => {
    if (activeSimulations.has(track.id)) return;
    if (track.logisticsStatus === 'waiting_for_delivery') return;

    const path = track.path;
    const totalSteps = path.length;
    const processedStops = new Set<string>();

    let index = 0;
    if (track.currentCoords && track.currentCoords.length === 2) {
        let minD = Infinity;
        path.forEach((p, i) => {
            const d = Math.sqrt(Math.pow(p[0] - track.currentCoords[0], 2) + Math.pow(p[1] - track.currentCoords[1], 2));
            if (d < minD) { minD = d; index = i; }
        });
        if (index >= totalSteps - 1 && track.logisticsStatus !== 'delivering') index = 0;
    }

    console.log(`[仿真启动] ${track.id} | 状态: ${track.logisticsStatus} | 步数: ${totalSteps}`);

    const timer = setInterval(async () => {
        // --- 1. 到达终点 ---
        if (index >= totalSteps) {
            clearInterval(timer);
            activeSimulations.delete(track.id);
            const finalPoint = path[totalSteps - 1];

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
            else if (track.logisticsStatus === 'delivering') {
                const log = {
                    time: new Date(),
                    location: track.userAddress,
                    description: '已签收，感谢您的使用',
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
            }
            return;
        }

        // --- 2. 中转站检测 ---
        if (track.logisticsStatus === 'shipped' && track.transitStops && track.transitStops.length > 0) {
            const stop = track.transitStops.find(s => Math.abs(s.stepIndex - index) <= 3);
            if (stop && !processedStops.has(stop.hubName)) {
                const currentDoc = await TrackInfo.findOne({ id: track.id });
                const exists = currentDoc?.tracks.some(t => t.location === stop.hubName);
                if (!exists) {
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

    }, 1000);

    activeSimulations.set(track.id, timer);
};

// --- 调度器 ---
const checkAndDispatch = async (hubName: string) => {
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
        dispatchBatch(hubName, orders);
    }
};

const dispatchBatch = async (hubName: string, orders: ITrack[]) => {
    const startCoords = orders[0].currentCoords as [number, number];
    const destinations = orders.map(o => ({ id: o.id, coords: o.endCoords as [number, number] }));
    const sortedOrderIds = await solveTSP(startCoords, destinations);

    let accumulatedSegment: number[][] = [];
    let prevCoords = startCoords;

    for (const orderId of sortedOrderIds) {
        const order = orders.find(o => o.id === orderId)!;
        const trunkPath = order.path;

        // 🟢 关键：延时 800ms，确保 API 有足够时间响应
        await new Promise(resolve => setTimeout(resolve, 2000));

        const newSegment = await getDrivingRoute(prevCoords, order.endCoords as [number, number]);

        // 🟢 关键：双重保底，如果 newSegment 依然为空，手动插入终点，防止路径不增长
        if (!newSegment || newSegment.length === 0) {
            accumulatedSegment.push(order.endCoords as [number, number]);
        } else {
            accumulatedSegment = [...accumulatedSegment, ...newSegment];
        }

        const simpleSegment = accumulatedSegment.filter((_, i) => i % 2 === 0);
        const fullPath = [...trunkPath, ...simpleSegment];

        const log = {
            time: new Date(),
            location: hubName,
            description: `调度完成，快递员已从【${hubName}人民政府】出发，开始派送`,
            status: 'delivering',
            operator: '调度系统'
        };

        await TrackInfo.updateOne(
            { id: order.id },
            {
                $set: { logisticsStatus: 'delivering', path: fullPath, currentCoords: startCoords },
                $push: { tracks: log }
            }
        );

        broadcast({ type: 'STATUS_UPDATE', id: order.id, status: 'delivering', newLog: log });
        prevCoords = order.endCoords as [number, number];
    }

    setTimeout(async () => {
        for (const id of sortedOrderIds) {
            const o = await TrackInfo.findOne({ id });
            if (o) startSimulation(o);
        }
    }, 1000);
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