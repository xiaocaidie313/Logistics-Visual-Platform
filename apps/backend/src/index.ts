import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import routes from './routes/index.js';

const app = express();
const PORT = process.env.PORT || 3002;  // 定义端口

// MongoDB 连接配置
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/logistics';

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
app.get("/api/hello", (req, res) => {
  res.send("Hello from 物流平台后端 API!" );
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 后端服务运行在 http://localhost:${PORT}`);
  console.log(`📊 健康检查: http://localhost:${PORT}/health`);
});

