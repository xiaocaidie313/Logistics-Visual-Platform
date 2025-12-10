import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from "./pages/Login";
import AdminDashboard from "./pages/Admin";
import UserDashboard from "./pages/UserMobile/User";
import UserHomeDetail from "./pages/UserMobile/UserHomeDetail";
import ProtectedRoute from "./components/ProtectedRoute";
import MerchantDashboard from "./pages/merchant/index";
import "./App.css";
import OrderTrack from "./pages/UserMobile/orderTrack";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 登录页面 */}
        <Route path="/login" element={<Login />} />
        {/* 管理员端 */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/merchant" 
        element={
          <ProtectedRoute>
            <MerchantDashboard />
          </ProtectedRoute>
        } />
        {/* 用户端 */}
        <Route
          path="/customer"
          element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/detail/ordertrack/:id"
          element={
            <ProtectedRoute>
              <OrderTrack/>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/detail/product/:id"
          element={
            <ProtectedRoute>
              <UserHomeDetail/>
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

