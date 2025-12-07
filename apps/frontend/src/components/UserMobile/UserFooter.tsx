import React from "react";
import {
  HomeOutlined,
  ShoppingOutlined,
  UserOutlined,
} from "@ant-design/icons";

interface UserFooterProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const UserFooter: React.FC<UserFooterProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { key: "home", icon: <HomeOutlined />, label: "首页" },
    { key: "orders", icon: <ShoppingOutlined />, label: "订单" },
    { key: "profile", icon: <UserOutlined />, label: "我的" },
  ];

  return (
    <div
      style={{
        bottom: 0,
        position: "fixed",
        width: "100%",
        height: "60px",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        backgroundColor: "#fff",
        borderTop: "1px solid #e5e5e5",
        boxShadow: "0 -2px 10px 0 rgba(0, 0, 0, 0.1)",
        zIndex: 1000,
        paddingBottom: "env(safe-area-inset-bottom)", // iPhone 安全区适配
      }}
    >
      {tabs.map((tab) => (
        <div
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            fontSize: "12px",
            cursor: "pointer",
            transition: "color 0.3s",
          }}
        >
          <div
            style={{
              color: activeTab === tab.key ? "#1890ff" : "#666",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ fontSize: "20px", marginBottom: "4px" }}>
              {tab.icon}
            </div>
            <span>{tab.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserFooter;
