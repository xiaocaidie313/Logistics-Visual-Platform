import { useState } from 'react';
import { Layout, Menu } from 'antd';
import { ShoppingOutlined, UserOutlined } from '@ant-design/icons';
import OrderManagement from "./pages/OrderManagement";
import UserManagement from "./pages/UserManagement";
import "./App.css";

const { Header, Sider, Content } = Layout;

type MenuKey = 'orders' | 'users' | 'dashboard';

function App() {
  const [selectedMenu, setSelectedMenu] = useState<MenuKey>('orders');

  const menuItems = [
    {
      key: 'orders',
      icon: <ShoppingOutlined />,
      label: '订单管理',
    },
    {
      key: 'users',
      icon: <UserOutlined />,
      label: '用户管理',
    },
  ];

  const renderContent = () => {
    switch (selectedMenu) {
      case 'orders':
        return <OrderManagement />;
      case 'users':
        return <UserManagement />;
      default:
        return <OrderManagement />;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        background: '#001529', 
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        color: '#fff',
        fontSize: '20px',
        fontWeight: 600,
      }}>
        <ShoppingOutlined style={{ marginRight: 12, fontSize: 24 }} />
        电商管理平台 - 商家端
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
            {renderContent()}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}

export default App;

