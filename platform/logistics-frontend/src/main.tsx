// import { StrictMode } from 'react'
// import { createRoot } from 'react-dom/client'
// import './index.css'

// // --- 修改点 1: 引入配置文件 ---
// // 这一行非常重要！它会执行 config.ts 里的代码，把安全密钥注入到 window 对象中。
// // 如果不加这行，地图会报错或无法加载。
// import './utils/config'

// // --- 修改点 2: 引入我们写好的业务页面 ---
// // 这里的路径指向我们刚才创建的 LogisticsTracking 文件夹
// import LogisticsTracking from './pages/LogisticsTracking'

// createRoot(document.getElementById('root')!).render(
//   <StrictMode>
//     {/* --- 修改点 3: 替换 <App /> --- */}
//     {/* 不再渲染默认的 App 组件，而是渲染我们的物流可视化组件 */}
//     <LogisticsTracking />
//   </StrictMode>,
// )
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// 引入路由入口组件 App
import App from './App'
import './utils/config'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* 将 LogisticsTracking 替换为 App，以便路由生效 */}
    <App />
  </StrictMode>,
)