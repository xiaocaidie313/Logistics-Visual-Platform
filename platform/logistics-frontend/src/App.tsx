import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LogisticsTracking from './pages/LogisticsTracking'; // 管理员后台
import UserTracking from './pages/UserTracking';         // 用户端页面

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. 管理员后台 (访问 http://localhost:5173/) */}
        <Route path="/" element={<LogisticsTracking />} />

        {/* 2. 用户端查询页 (访问 http://localhost:5173/trace?id=SFxxxx) */}
        <Route path="/trace" element={<UserTracking />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;