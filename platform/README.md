根据我们完成的电商物流配送可视化平台项目，以下是所有用到过的依赖包和库的完整清单。

---
1. 根目录 (platform/)

这里主要负责“一键启动”前后端服务，只用到了一个工具包。
- 开发依赖 (devDependencies):
  - concurrently: 并行运行多个命令的工具。我们用它来实现 npm run dev 同时启动前端（Vite）和后端（Node/Nodemon）。
安装命令：
Bash
npm install concurrently --save-dev

---

2. 前端项目 (platform/frontend/)

技术栈：React + TypeScript + Vite + Ant Design + ECharts + 高德地图
- 生产依赖 (dependencies):
  - antd: 蚂蚁金服 UI 组件库（使用了 Layout, Card, Input, Button, Timeline, Tag, Statistic 等组件）。
  - @ant-design/icons: Ant Design 的图标库（使用了 CarOutlined, ClockCircleOutlined 等）。
  - @amap/amap-jsapi-loader: 高德地图官方推荐的 JSAPI 加载器（比旧版 react-amap 更稳定，支持 2.0 3D 视图）。
  - echarts: 百度开源的数据可视化图表库核心。
  - echarts-for-react: ECharts 的 React 封装组件，方便在 React 中使用。
  - dayjs: 轻量级的时间处理库（用于格式化时间轴上的时间显示）。
- 开发依赖 (devDependencies):
  - typescript: TS 语言支持。
  - vite: 构建工具。
  - @vitejs/plugin-react: Vite 的 React 插件。
  - @types/node: Node.js 类型定义（解决 path 等模块报错）。
安装命令：
Bash
cd frontend
npm install antd @ant-design/icons @amap/amap-jsapi-loader echarts echarts-for-react dayjs
npm install -D typescript @types/node
npm install react-router-dom

---

3. 后端项目 (platform/backend/)

技术栈：Node.js + Express + TypeScript + MongoDB + WebSocket + Axios
- 生产依赖 (dependencies):
  - express: Web 服务框架，用于提供 RESTful API（创建订单、查询详情）。
  - mongoose: MongoDB 的对象模型工具（ORM），用于定义 Schema 和操作数据库。
  - cors: 处理跨域资源共享（解决前端 5173 访问后端 3002 的跨域问题）。
  - ws: WebSocket 库，用于实现后端主动向前端推送实时坐标和小车状态。
  - axios: HTTP 客户端，用于后端调用高德 Web 服务 API（地理编码，将地址转为坐标）。
  - dayjs: 时间处理库，用于生成后端日志的时间戳。
- 开发依赖 (devDependencies):
  - typescript: TS 语言支持。
  - ts-node: 让 Node.js 可以直接运行 .ts 文件（开发环境用）。
  - nodemon: 监听文件变化并自动重启服务器（开发神器）。
  - 类型定义包:
    - @types/express
    - @types/node
    - @types/cors
    - @types/ws
    - @types/mongoose (新版 mongoose 自带类型，但有时旧习惯会装)
安装命令：
Bash
cd backend
npm install express mongoose cors ws axios dayjs
npm install -D typescript ts-node nodemon @types/node @types/express @types/cors @types/ws