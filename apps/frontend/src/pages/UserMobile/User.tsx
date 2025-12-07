import React, { useState } from 'react';
import UserFooter from '../../components/UserMobile/UserFooter';
import UserContent from './UserContent';
import UserHeader from '../../components/UserMobile/UserHeader';

const UserDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#f5f5f5',
      overflow: 'hidden'
    }}>
      {/* 顶部导航栏 - 固定 */}
      <UserHeader activeTab={activeTab} />
      
      {/* 内容区域 - 可滚动 */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        marginTop: '50px', // Header 高度
        marginBottom: '60px', // Footer 高度
        padding: '14px',
        WebkitOverflowScrolling: 'touch' // iOS 平滑滚动
      }}>
        <UserContent activeTab={activeTab} />
      </div>
      
      {/* 底部导航栏 - 固定 */}
      <UserFooter activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

export default UserDashboard;