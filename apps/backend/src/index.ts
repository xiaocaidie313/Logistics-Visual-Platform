import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3002;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康检查路由
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "物流平台后端服务运行正常" });
});

// API 路由示例
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from 物流平台后端 API!" });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 后端服务运行在 http://localhost:${PORT}`);
  console.log(`📊 健康检查: http://localhost:${PORT}/health`);
});

