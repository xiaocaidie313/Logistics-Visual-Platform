import { useState, useEffect } from 'react';
import { Layout, Menu, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ShoppingOutlined, UserOutlined, AppstoreOutlined, LogoutOutlined, ShopOutlined } from '@ant-design/icons';

import { getUser, User } from '../../services/userService';

import OrderManagement from "./OrderManagement";
import ProductManagement from "./ProductManagement";

const { Header, Sider, Content } = Layout;

type MenuKey = 'orders' | 'users' | 'products' | 'merchants' | 'dashboard';

const MerchantDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [selectedMenu, setSelectedMenu] = useState<MenuKey>('products');
  const [userInfo, setUserInfo] = useState<any>(null);
  const [merchantId, setMerchantId] = useState<string>('');


  // 检查登录状态
  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn');
    const user = localStorage.getItem('userInfo');
    if (loggedIn === 'true' && user) {
      setUserInfo(JSON.parse(user));
      setMerchantId((JSON.parse(user) as User)._id as string);
    } else {
      setUserInfo(null);
      // 返回登录页面 未登录
      navigate('/login');
    }
  }, [navigate, setMerchantId]);

  // 登出
  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userInfo');
    setUserInfo(null);
    navigate('/login');
  };

  const menuItems = [
    {
      key: 'products',
      icon: <AppstoreOutlined />,
      label: '商品管理',
    },
    {
      key: 'orders',
      icon: <ShoppingOutlined />,
      label: '订单管理',
    },
  ];

  const renderContent = () => {
    switch (selectedMenu) {
      case 'products':
        return <ProductManagement />;
      case 'orders':
        return <OrderManagement />;
      default:
        return <ProductManagement />;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        background: '#001529', 
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: '#fff',
        fontSize: '20px',
        fontWeight: 600,
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <AppstoreOutlined style={{ marginRight: 12, fontSize: 24 }} />
          电商管理平台 - 商家端
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {userInfo && (
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>
              商家: {userInfo.username}
            </span>
          )}
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            style={{ color: '#fff' }}
          >
            登出
          </Button>
        </div>
      </Header>
      <Layout>
        <Sider
          width={200}
          style={{ background: '#fff' }}
        >
          <Menu
            mode="inline"
            selectedKeys={[selectedMenu]}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
            onClick={({ key }) => setSelectedMenu(key as MenuKey)}
          />
        </Sider>
        <Layout style={{ padding: 0 }}>
          <Content style={{ margin: 0, minHeight: 280 }}>
            {/* 渲染组件 */}
            {renderContent()}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default MerchantDashboard;
