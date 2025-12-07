import React, { useState, useEffect } from "react";
import { UserOutlined, PhoneOutlined, EnvironmentOutlined, EditOutlined } from "@ant-design/icons";
import { getUser } from "../../services/userService";
import type { User } from "../../services/userService";

const UserProfile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取用户ID
  const getUserId = () => {
    const userInfo = localStorage.getItem("userInfo");
    if (userInfo) {
      try {
        const user = JSON.parse(userInfo);
        return user._id || user.id;
      } catch (e) {
        console.error("解析用户信息失败:", e);
        return null;
      }
    }
    return null;
  };

  // 加载用户信息
  const loadUserInfo = async () => {
    const userId = getUserId();
    if (!userId) {
      setError("未找到用户信息，请重新登录");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await getUser(userId);
      if (response.code === 200) {
        setUser(response.data);
      } else {
        setError(response.message || "获取用户信息失败");
      }
    } catch (err: any) {
      console.error("获取用户信息失败:", err);
      setError(err.message || "获取用户信息失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserInfo();
  }, []);

  // 加载中状态
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        加载中...
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0", color: "#ff4d4f" }}>
        {error}
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0", color: "#999" }}>
        暂无用户信息
      </div>
    );
  }

  // 获取性别显示文本
  const getGenderText = (gender?: string) => {
    switch (gender) {
      case "male":
        return "男";
      case "female":
        return "女";
      case "other":
        return "其他";
      default:
        return "未设置";
    }
  };

  return (
    <div>
      {/* 用户基本信息卡片 */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "18px",
          padding: "20px",
          marginBottom: "12px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              backgroundColor: "#f0f0f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: "16px",
            }}
          >
            <UserOutlined style={{ fontSize: "30px", color: "#999" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#333",
                marginBottom: "4px",
              }}
            >
              {user.username || "未设置用户名"}
            </div>
            <div
              style={{
                fontSize: "14px",
                color: "#999",
              }}
            >
              {getGenderText(user.gender)}
            </div>
          </div>
        </div>

        {/* 手机号 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "12px 0",
            borderTop: "1px solid #f0f0f0",
            borderBottom: "1px solid #f0f0f0",
            marginBottom: "12px",
          }}
        >
          <PhoneOutlined style={{ fontSize: "16px", color: "#666", marginRight: "12px" }} />
          <span style={{ fontSize: "14px", color: "#333" }}>
            {user.phoneNumber || "未设置手机号"}
          </span>
        </div>

        {/* 角色 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "12px 0",
          }}
        >
          <UserOutlined style={{ fontSize: "16px", color: "#666", marginRight: "12px" }} />
          <span style={{ fontSize: "14px", color: "#333" }}>
            {user.role === "customer" ? "普通用户" : user.role === "merchant" ? "商家" : user.role === "admin" ? "管理员" : "未设置"}
          </span>
        </div>
      </div>

      {/* 收货地址卡片 */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "18px",
          padding: "20px",
          marginBottom: "12px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              fontSize: "16px",
              fontWeight: "600",
              color: "#333",
              display: "flex",
              alignItems: "center",
            }}
          >
            <EnvironmentOutlined style={{ marginRight: "8px", fontSize: "18px" }} />
            收货地址
          </div>
          <EditOutlined style={{ fontSize: "16px", color: "#999", cursor: "pointer" }} />
        </div>

        {user.addresses && user.addresses.length > 0 ? (
          <div>
            {user.addresses.map((address, index) => (
              <div
                key={address._id || index}
                style={{
                  padding: "12px",
                  backgroundColor: address.isDefault ? "#f0f7ff" : "#fafafa",
                  borderRadius: "8px",
                  marginBottom: index < user.addresses!.length - 1 ? "12px" : "0",
                  border: address.isDefault ? "1px solid #1890ff" : "1px solid #f0f0f0",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "8px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#333",
                    }}
                  >
                    {address.contactName}
                  </div>
                  {address.isDefault && (
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#1890ff",
                        backgroundColor: "#e6f7ff",
                        padding: "2px 8px",
                        borderRadius: "4px",
                      }}
                    >
                      默认
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#666",
                    marginBottom: "4px",
                  }}
                >
                  {address.contactPhone}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#666",
                    lineHeight: "1.6",
                  }}
                >
                  {address.province} {address.city} {address.district} {address.detailAddress}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "20px 0",
              color: "#999",
              fontSize: "14px",
            }}
          >
            暂无收货地址
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;