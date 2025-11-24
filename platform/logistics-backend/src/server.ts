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
mongoose.connect('mongodb://localhost:27017/logistics_db')
    .then(() => console.log('✅ MongoDB 连接成功'))
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
    if (activeSimulations.has(track.id)) return;

    let index = 0;
    const path = track.path;
    const totalSteps = path.length;

    const timer = setInterval(async () => {
        // 到达终点
        if (index >= totalSteps) {
            clearInterval(timer);
            activeSimulations.delete(track.id);

            track.logisticsStatus = 'delivered';
            track.currentCoords = track.endCoords;
            track.tracks.push({
                time: new Date(),
                location: track.userAddress,
                description: '已签收，感谢使用',
                status: 'delivered'
            });
            await track.save();

            broadcast({ type: 'STATUS_UPDATE', id: track.id, status: 'delivered' });
            return;
        }

        // 移动中
        const currentPos = path[index];

        // 实时推送
        broadcast({
            type: 'LOCATION_UPDATE',
            id: track.id,
            position: currentPos,
            progress: Math.floor((index / totalSteps) * 100),
            // 简单判断位置描述
            info: index < totalSteps / 2 ? '正在前往中转中心' : '正在前往目的地'
        });

        index++;
    }, 200); // 200ms 刷新一次位置

    activeSimulations.set(track.id, timer);
};

// --- 3. API 接口 ---

// [POST] 创建物流订单 (自动规划路线)
app.post('/api/tracks/create', async (req, res) => {
    try {
        const body = req.body;

        // A. 智能规划路线 (核心功能)
        const { startCoords, endCoords, path } = planRoute(body.sendAddress, body.userAddress);
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
    const track = await TrackInfo.findOne({ id: req.params.id });
    if (track && track.logisticsStatus === 'shipped') {
        // 如果是刷新页面，且订单还在运输中，重启仿真
        startSimulation(track);
    }
    res.json(track);
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