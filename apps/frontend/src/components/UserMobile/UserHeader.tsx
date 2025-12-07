import React, { useEffect } from "react";
import { LeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import {useState} from 'react';
import { useLocation, useParams, useMatch } from 'react-router-dom';
interface UserHeaderProps {
  activeTab?: string;
}

const UserHeader: React.FC<UserHeaderProps> = ({ activeTab = 'orders' }) => {
  const navigate = useNavigate();
  const [isDetail, setIsDetail] = useState(false);
  const location = useLocation();
  const pathname = location.pathname;
  useEffect(() => {
    setIsDetail(pathname.includes('/customer/detail/'));  
  }, [pathname]);
  const getTitle = () => {
    switch (activeTab) {
      case 'home':
        return '首页';
      case 'orders':
        return '我的订单';
      case 'profile':
        return '我的';
      default:
        return '我的订单';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '50px',
      background: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
      zIndex: 1000,
    }}>
      {isDetail && <LeftOutlined onClick={() => navigate(-1)} style={{ fontSize: '20px', margin: '10px', position: 'absolute', left: '10px' }} />}
      <div style={{
        fontSize: '18px',
        fontWeight: 600,
        color: '#333'
      }}>
        {getTitle()}
      </div>
    </div>
  );
};

export default UserHeader;