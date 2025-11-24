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
mongoose.connect('mongodb://localhost:27017/logistics')
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
// 修改 server.ts 中的 startSimulation 函数

const startSimulation = (track: ITrack) => {
    if (activeSimulations.has(track.id)) return;

    let index = 0;
    const path = track.path;
    const totalSteps = path.length;

    // 我们假设路径的中间点 (50%处) 是中转站
    const middleIndex = Math.floor(totalSteps / 2);
    let hasLoggedMiddle = false; // 防止重复记录中转站

    const timer = setInterval(async () => {
        // --- 阶段 A: 到达终点 ---
        if (index >= totalSteps) {
            clearInterval(timer);
            activeSimulations.delete(track.id);

            // 1. 更新主状态
            track.logisticsStatus = 'delivered';
            track.currentCoords = track.endCoords;

            // 2. 插入【已签收】物流详情
            const finalLog = {
                time: new Date(),
                location: track.userAddress, // 收货地址
                description: '您的快件已被【蜂巢快递柜】代收，感谢使用',
                status: 'delivered',
                operator: '快递员小王'
            };
            track.tracks.push(finalLog);

            await track.save();

            // 3. 推送“结束”消息给前端
            broadcast({ type: 'STATUS_UPDATE', id: track.id, status: 'delivered', newLog: finalLog });
            return;
        }

        // --- 阶段 B: 到达中转站 (模拟) ---
        // 当小车走到路径的一半时，模拟到达一个中转中心
        if (index === middleIndex && !hasLoggedMiddle) {
            hasLoggedMiddle = true;

            // 1. 插入【到达中转】物流详情
            // 我们简单地取发货地址的前两个字 + "中转中心" 模拟一下，或者根据之前的 Hub 逻辑
            const transferLog = {
                time: new Date(),
                location: '华东区域枢纽中心',
                description: '快件已到达【华东区域枢纽中心】，正发往下一站',
                status: 'shipped',
                operator: '分拣员8号'
            };

            track.tracks.push(transferLog);
            await track.save();

            // 2. 推送“新增日志”消息给前端 (前端收到后，在时间轴上加一个点)
            broadcast({ type: 'LOG_UPDATE', id: track.id, newLog: transferLog });
        }

        // --- 阶段 C: 实时移动 ---
        const currentPos = path[index];

        // 实时推送坐标
        broadcast({
            type: 'LOCATION_UPDATE',
            id: track.id,
            position: currentPos,
            progress: Math.floor((index / totalSteps) * 100),
            info: index < middleIndex ? '正在前往中转中心' : '正在前往目的地'
        });

        index++;
    }, 200); // 频率

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