import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 加载根目录的 dev.env 文件
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../../dev.env') });

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { createServer } from "http";
import routes from './routes/index.js';
import { WebSocketServer } from './services/websocket.js';

const app = express();
const PORT = process.env.PORT;  // 定义端口
const BACKEND_SERVER_URL = process.env.BACKEND_SERVER_URL;
if (!BACKEND_SERVER_URL) {
  throw new Error('BACKEND_SERVER_URL 环境变量未设置');
}

// 创建http服务器 // 通过app入口  
const httpServer = createServer(app);

// MongoDB 连接配置
const MONGODB_URI = process.env.MONGO_URI;
if (!MONGODB_URI) {
  throw new Error('MONGO_URI 环境变量未设置');
}

// 连接 MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB 连接成功');
  })
  .catch((error) => {
    console.error(' MongoDB 连接失败:', error);
  });

  
// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', routes); // 挂载所有路由

// 健康检查路由
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "物流平台后端服务运行正常" });
});

// API 路由示例
app.get("/", (req, res) => {
  res.send("Hello from 物流平台后端 API!" );
});

// 初始化 WebSocket
WebSocketServer(httpServer);

// 启动服务器
httpServer.listen(PORT, () => {
  console.log(`后端服务运行在 ${BACKEND_SERVER_URL}:${PORT}`);
  console.log(`健康检查: ${BACKEND_SERVER_URL}:${PORT}/health`);
  console.log(`WebSocket 服务已启动`);
});

