# 应用说明

本目录包含三个应用：

## 📱 user-app - 用户端应用
- **类型**: React + Vite 应用
- **端口**: 3000
- **技术栈**: React 19, TypeScript, Vite
- **用途**: 面向最终用户的物流可视化平台前端

### 运行方式
```bash
# 开发模式
npm run dev --filter=user-app
# 或
cd apps/user-app && npm run dev

# 构建
npm run build --filter=user-app

# 预览构建结果
npm run preview --filter=user-app
```

访问地址: http://localhost:3000

---

## 🏪 merchant-app - 商户端应用
- **类型**: React + Vite 应用
- **端口**: 3001
- **技术栈**: React 19, TypeScript, Vite
- **用途**: 面向商户的管理系统前端

### 运行方式
```bash
# 开发模式
npm run dev --filter=merchant-app
# 或
cd apps/merchant-app && npm run dev

# 构建
npm run build --filter=merchant-app

# 预览构建结果
npm run preview --filter=merchant-app
```

访问地址: http://localhost:3001

---

## 🔧 backend - 后端服务
- **类型**: Node.js + Express
- **端口**: 3002
- **技术栈**: TypeScript, Express, CORS
- **用途**: 提供 API 服务

### 运行方式
```bash
# 开发模式（使用 tsx 热重载）
npm run dev --filter=backend
# 或
cd apps/backend && npm run dev

# 构建
npm run build --filter=backend

# 生产模式
npm run start --filter=backend
```

API 地址: http://localhost:3002
健康检查: http://localhost:3002/health

---

## 🚀 同时运行所有应用

在项目根目录运行：

```bash
# 启动所有应用的开发服务器
npm run dev

# 构建所有应用
npm run build
```

## 📦 共享包

所有应用都可以使用 `@repo/ui` 共享组件库：

```typescript
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
```

