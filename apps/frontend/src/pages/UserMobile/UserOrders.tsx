import React, { useState, useEffect } from "react";
import UserOrderItem from "../../components/UserMobile/UserOrderItem";
import { Order, getOrderList } from "../../services/UserMobile/orderService";

const UserOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取用户ID
  const getUserId = () => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      try {
        const user = JSON.parse(userInfo);
        console.log('用户信息:', user);
        return user._id || user.id;
      } catch (e) {
        console.error('解析用户信息失败:', e);
        return null;
      }
    }
    return null;
  };

  // 加载订单列表
  const loadOrders = async () => {
    const userId = getUserId();
    if (!userId) {
      setError('未找到用户信息，请重新登录');
      return;
    }
    setLoading(true);
    setError(null);
    try {
        //发送请求
      const response = await getOrderList(userId);
      if (response.code === 200) {
        console.log("response.data", response.data);
        const showData = response.data.reverse();
        setOrders(showData || []);
      } else {
        setError(response.message || '获取订单列表失败');
      }
    } catch (err: any) {
      console.error('获取订单列表失败:', err);
      setError(err.message || '获取订单列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 组件加载时获取订单列表
  useEffect (()=>{
    loadOrders();
  },[])

  // 加载中状态
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        加载中...
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: '#ff4d4f' }}>
        {error}
      </div>
    );
  }

  // 空状态
  if (orders.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
        暂无订单
      </div>
    );
  }

  // 渲染订单列表
  return (
    <div>
      {orders.map((order) => (
        <UserOrderItem key={order._id || order.orderId} order={order} />
      ))}
    </div>
  );
};

export default UserOrders;