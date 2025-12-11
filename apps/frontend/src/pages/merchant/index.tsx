import { useState, useEffect } from 'react';
import { Layout, Menu, Button} from 'antd';
import { useNavigate } from 'react-router-dom';
import { ShoppingOutlined, UserOutlined, AppstoreOutlined, LogoutOutlined, ShopOutlined, LineChartOutlined } from '@ant-design/icons';

import { getUser, User } from '../../services/userService';

import OrderManagement from "./OrderManagement";
import ProductManagement from "./ProductManagement";
import DataAnalysis from './DataAnalysis';

const { Header, Sider, Content } = Layout;

type MenuKey = 'orders' | 'users' | 'products' | 'merchants' | 'dashboard' | 'product-analysis' | 'order-analysis' | 'order-trend';

const MerchantDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [selectedMenu, setSelectedMenu] = useState<MenuKey>('products');
  const [openKeys, setOpenKeys] = useState<string[]>([]);
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
    {
      key: 'dashboard',
      icon: <LineChartOutlined />,
      label: '数据分析',
      children: [
        { key: 'product-analysis', label: '商品分析' },
        { key: 'order-analysis', label: '订单分析' },
        { key: 'order-trend', label: '订单趋势分析' },
      ],
    },
  ];

  const renderContent = () => { 
    switch (selectedMenu) {
      case 'products':
        return <ProductManagement />;
      case 'orders':
        return <OrderManagement />;
      case 'dashboard':
      case 'product-analysis':
      case 'order-analysis':
      case 'order-trend':
        return <DataAnalysis analysisType={selectedMenu === 'product-analysis' ? 'product' : selectedMenu === 'order-analysis' ? 'order' : selectedMenu === 'order-trend' ? 'order-trend' : undefined} />;
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
            openKeys={openKeys}
            onOpenChange={setOpenKeys}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
            onClick={({ key }) => {
              // 如果是子菜单项，直接设置选中
              if (key === 'product-analysis' || key === 'order-analysis') {
                setSelectedMenu(key as MenuKey);
                // 确保父菜单展开
                if (!openKeys.includes('dashboard')) {
                  setOpenKeys([...openKeys, 'dashboard']);
                }
              } else {
                // 如果是父菜单项
                setSelectedMenu(key as MenuKey);
              }
            }}
          />
        </Sider>
        <Layout style={{ padding: 0, height: 'calc(100vh - 64px)', overflow: 'hidden'}}>
          <Content style={{ 
           margin: 0, 
           minHeight: 280,
           height: '100%',
           overflowY: 'auto',
           overflowX: 'hidden'
           }}>
            {/* 渲染组件 */}
            {renderContent()}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default MerchantDashboard;
