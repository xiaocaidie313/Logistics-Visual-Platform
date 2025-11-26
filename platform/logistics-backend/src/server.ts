import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import TrackInfo, { ITrack } from './models/Track';
import { planRoute, extractProvince } from './utils/geoService';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

// --- 1. 连接数据库 ---
mongoose.connect('mongodb://xuxy:123xuxy@47.109.143.184:27017/logistics')
    .then(() => console.log('✅ MongoDB (logistics) 连接成功'))
    .catch(err => console.error('❌ MongoDB 连接失败:', err));

// --- 2. 仿真引擎 ---
const activeSimulations = new Map<string, NodeJS.Timeout>();
const connectedClients = new Set<WebSocket>();

// 广播消息给前端
const broadcast = (data: any) => {
    connectedClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
};

// 启动单条轨迹仿真
const startSimulation = (track: ITrack) => {
    // 1. 防止冲突：清除旧定时器
    if (activeSimulations.has(track.id)) {
        console.log(`[仿真重置] 订单 ${track.id} 正在运行，清除旧任务并重启...`);
        clearInterval(activeSimulations.get(track.id));
        activeSimulations.delete(track.id);
    }

    const path = track.path;
    const totalSteps = path.length;
    const transitStops = track.transitStops || [];

    // 计算断点续传
    let startIndex = 0;
    if (track.currentCoords && track.currentCoords.length === 2) {
        const foundIndex = path.findIndex(p =>
            Math.abs(p[0] - track.currentCoords[0]) < 0.000001 &&
            Math.abs(p[1] - track.currentCoords[1]) < 0.000001
        );
        if (foundIndex !== -1) startIndex = foundIndex;
    }

    let index = startIndex;
    console.log(`[仿真启动] 订单 ${track.id} 开始移动，总步数: ${totalSteps}`);

    const timer = setInterval(async () => {
        // --- 阶段 A: 到达终点 ---
        if (index >= totalSteps) {
            clearInterval(timer);
            activeSimulations.delete(track.id);

            const finalLog = {
                time: new Date(),
                location: track.userAddress,
                description: '您的快件已被【蜂巢快递柜】代收，感谢使用',
                status: 'delivered',
                operator: '快递员小王'
            };

            // 🟢 [核心修复] 使用 findOneAndUpdate 原子更新，避开版本冲突
            await TrackInfo.findOneAndUpdate(
                { id: track.id },
                {
                    $set: { logisticsStatus: 'delivered', currentCoords: track.endCoords },
                    $push: { tracks: finalLog }
                }
            );

            broadcast({ type: 'STATUS_UPDATE', id: track.id, status: 'delivered', newLog: finalLog });
            return;
        }

        // --- 阶段 B: 到达中转站 ---
        const hitHub = transitStops.find(stop => index >= stop.stepIndex && index < stop.stepIndex + 2);
        if (hitHub) {
            // 这里需要先查一下最新的 track，因为 tracks 数组可能被并发修改了
            const latestTrack = await TrackInfo.findOne({ id: track.id });
            const alreadyLogged = latestTrack?.tracks.some(t => t.description.includes(hitHub.hubName));

            if (!alreadyLogged) {
                const hubLog = {
                    time: new Date(),
                    location: hitHub.hubName,
                    description: `快件已到达【${hitHub.hubName}】，正发往下一站`,
                    status: 'shipped',
                    operator: '分拣中心'
                };

                // 🟢 [核心修复] 使用原子更新插入日志
                await TrackInfo.findOneAndUpdate(
                    { id: track.id },
                    { $push: { tracks: hubLog } }
                );

                broadcast({ type: 'LOG_UPDATE', id: track.id, newLog: hubLog });
            }
        }

        // --- 阶段 C: 实时移动 ---
        const currentPos = path[index];

        // 🟢 [核心修复] 只更新坐标，不读取整个文档再保存，极大降低冲突概率
        if (index % 5 === 0) {
            await TrackInfo.updateOne(
                { id: track.id },
                { $set: { currentCoords: currentPos } }
            );
        }

        broadcast({
            type: 'LOCATION_UPDATE',
            id: track.id,
            position: currentPos,
            progress: Math.floor((index / totalSteps) * 100),
            info: hitHub ? `到达 ${hitHub.hubName}` : '运输中...'
        });

        index++;
    }, 2000);

    activeSimulations.set(track.id, timer);
};

// --- 3. API 接口 ---

// [POST] 创建物流订单 (自动规划路线)
app.post('/api/tracks/create', async (req, res) => {
    try {
        const body = req.body;

        // A. 智能规划路线 (核心功能)
        // 注意：geoService.ts 必须返回 transitStops
        const { startCoords, endCoords, path, transitStops } = await planRoute(body.sendAddress, body.userAddress);
        // B. 提取省份
        const province = extractProvince(body.userAddress);

        const newTrack = new TrackInfo({
            ...body,
            id: body.id || `T-${Date.now()}`,
            orderId: body.orderId || `ORD-${Date.now()}`,
            // 补充地图字段
            province,
            startCoords,
            endCoords,
            currentCoords: startCoords,
            path,
            transitStops, //  存入数据库
            logisticsStatus: 'shipped',
            // 初始化一条轨迹记录
            tracks: [{
                time: new Date(),
                location: body.sendAddress,
                description: '商家已发货',
                status: 'shipped'
            }]
        });

        await newTrack.save();

        // C. 立即启动仿真
        startSimulation(newTrack);

        res.json({ success: true, data: newTrack });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '创建失败', details: error });
    }
});

// [GET] 获取某订单详情
app.get('/api/tracks/:id', async (req, res) => {
    try {
        const trackId = req.params.id;
        const track = await TrackInfo.findOne({ id: trackId });

        if (!track) {
            return res.status(404).json({ success: false, message: '未找到该运单' });
        }

        // 如果订单还在运输中，重启仿真 (确保刷新页面后小车继续动)
        if (track.logisticsStatus === 'shipped' || track.logisticsStatus === 'shipping') {
            startSimulation(track);
        }

        res.json({
            success: true,
            data: track
        });

    } catch (error) {
        console.error("查询出错:", error);
        res.status(500).json({ success: false, error: '服务器内部错误' });
    }
});

// [GET] 省份订单密度统计 (MongoDB 聚合查询)
app.get('/api/stats/density', async (req, res) => {
    try {
        const stats = await TrackInfo.aggregate([
            {
                $group: {
                    _id: "$province", // 按省份分组
                    value: { $sum: 1 } // 计数
                }
            },
            {
                $project: {
                    name: "$_id",
                    value: 1,
                    _id: 0
                }
            }
        ]);
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: '统计失败' });
    }
});

// --- 4. 启动服务 ---
const server = app.listen(PORT, () => {
    console.log(`🚀 物流后端已启动: http://localhost:${PORT}`);
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    console.log('前端已连接 WebSocket');
    connectedClients.add(ws);
    ws.on('close', () => connectedClients.delete(ws));
});