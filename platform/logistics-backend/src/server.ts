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
    // 获取规划好的中转站列表 (如果没有则为空数组)
    const transitStops = track.transitStops || [];

    // --- 计算断点续传的 index ---
    let startIndex = 0;

    // 如果数据库里已经有当前坐标，尝试在路径中找到它
    if (track.currentCoords && track.currentCoords.length === 2) {
        // 我们遍历 path，找到与 currentCoords 经纬度误差极小的那个点
        // (使用 epsilon 0.000001 避免浮点数比较问题)
        const foundIndex = path.findIndex(p =>
            Math.abs(p[0] - track.currentCoords[0]) < 0.000001 &&
            Math.abs(p[1] - track.currentCoords[1]) < 0.000001
        );

        if (foundIndex !== -1) {
            startIndex = foundIndex;
            console.log(`[进度恢复] 订单 ${track.id} 从第 ${startIndex} 步继续运输`);
        } else {
            console.log(`[进度警告] 未在路径中找到当前坐标，从头开始`);
        }
    }

    // 将 index 初始化为找到的断点，而不是 0
    let index = startIndex;
    // --- 核心修复结束 ---

    console.log(`[仿真启动] 订单 ${track.id} 开始移动，总步数: ${totalSteps}, 中转站数: ${transitStops.length}`);

    const timer = setInterval(async () => {
        // --- 阶段 A: 到达终点 ---
        if (index >= totalSteps) {
            clearInterval(timer);
            activeSimulations.delete(track.id);

            track.logisticsStatus = 'delivered';
            track.currentCoords = track.endCoords;

            // 检查是否已经写过签收日志，防止重复
            const hasFinalLog = track.tracks.some(t => t.status === 'delivered');
            if (!hasFinalLog) {
                const finalLog = {
                    time: new Date(),
                    location: track.userAddress,
                    description: '您的快件已被【蜂巢快递柜】代收，感谢使用',
                    status: 'delivered',
                    operator: '快递员小王'
                };
                track.tracks.push(finalLog);
                await track.save();
                broadcast({ type: 'STATUS_UPDATE', id: track.id, status: 'delivered', newLog: finalLog });
            }
            return;
        }

        // --- 阶段 B: 检查是否到达中转站 (多点支持) ---
        // 逻辑：当前步数 index 是否落在某个中转站的 stepIndex 附近
        const hitHub = transitStops.find(stop =>
            index >= stop.stepIndex && index < stop.stepIndex + 2
        );

        if (hitHub) {
            // 防止重复记录同一个中转站
            const alreadyLogged = track.tracks.some(t => t.description.includes(hitHub.hubName));

            if (!alreadyLogged) {
                console.log(`[到达中转] ${hitHub.hubName}`);
                const hubLog = {
                    time: new Date(),
                    location: hitHub.hubName,
                    description: `快件已到达【${hitHub.hubName}】，正发往下一站`,
                    status: 'shipped',
                    operator: '分拣中心'
                };
                track.tracks.push(hubLog);
                await track.save();
                broadcast({ type: 'LOG_UPDATE', id: track.id, newLog: hubLog });
            }
        }

        // --- 阶段 C: 实时移动 ---
        const currentPos = path[index];

        // 更新内存状态
        track.currentCoords = currentPos;

        // 优化：每走 5 步存一次数据库，避免数据库 IO 太高，同时保证刷新页面时回退不太多
        if (index % 5 === 0) {
            await track.save();
        }

        broadcast({
            type: 'LOCATION_UPDATE',
            id: track.id,
            position: currentPos,
            progress: Math.floor((index / totalSteps) * 100),
            // 如果正好在中转站，显示中转站名字，否则显示运输中
            info: hitHub ? `到达 ${hitHub.hubName}` : '运输中...'
        });

        index++;
    }, 2000); // 2秒一步

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