import React, { useState, useEffect } from "react";
import { UserOutlined, PhoneOutlined, EnvironmentOutlined, EditOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { message, Popconfirm } from "antd";
import { getUser, addUserAddress, updateUserAddress, deleteUserAddress, setDefaultAddress } from "../../services/userService";
import type { User, Address } from "../../services/userService";
import AddressFormModal from "../../components/UserMobile/AddressFormModal";

const UserProfile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [addressModalMode, setAddressModalMode] = useState<'add' | 'edit'>('add');
  const [editingAddress, setEditingAddress] = useState<Address | undefined>(undefined);

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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "获取用户信息失败";
      console.error("获取用户信息失败:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // 处理添加地址
  const handleAddAddress = () => {
    setAddressModalMode('add');
    setEditingAddress(undefined);
    setAddressModalOpen(true);
  };

  // 处理编辑地址
  const handleEditAddress = (address: Address) => {
    setAddressModalMode('edit');
    setEditingAddress(address);
    setAddressModalOpen(true);
  };

  // 处理删除地址
  const handleDeleteAddress = async (addressId: string) => {
    const userId = getUserId();
    if (!userId || !addressId) {
      message.error("操作失败");
      return;
    }

    try {
      const response = await deleteUserAddress(userId, addressId);
      if (response.code === 200) {
        message.success("地址删除成功");
        setUser(response.data);
      } else {
        message.error(response.message || "删除地址失败");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "删除地址失败";
      console.error("删除地址失败:", err);
      message.error(errorMessage);
    }
  };

  // 处理设置默认地址
  const handleSetDefaultAddress = async (addressId: string) => {
    const userId = getUserId();
    if (!userId || !addressId) {
      message.error("操作失败");
      return;
    }

    try {
      const response = await setDefaultAddress(userId, addressId);
      if (response.code === 200) {
        message.success("默认地址设置成功");
        setUser(response.data);
      } else {
        message.error(response.message || "设置默认地址失败");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "设置默认地址失败";
      console.error("设置默认地址失败:", err);
      message.error(errorMessage);
    }
  };

  // 处理保存地址（添加或更新）
  const handleSaveAddress = async (addressData: Address) => {
    const userId = getUserId();
    if (!userId) {
      message.error("操作失败");
      return;
    }

    try {
      let response;
      if (addressModalMode === 'add') {
        response = await addUserAddress(userId, addressData);
      } else {
        // 编辑模式：先删除再添加
        if (!editingAddress?._id) {
          message.error("地址ID不存在");
          return;
        }
        response = await updateUserAddress(userId, editingAddress._id, addressData);
      }

      if (response.code === 200) {
        message.success(addressModalMode === 'add' ? "地址添加成功" : "地址更新成功");
        setUser(response.data);
        setAddressModalOpen(false);
      } else {
        message.error(response.message || "操作失败");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "保存地址失败";
      console.error("保存地址失败:", err);
      message.error(errorMessage);
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
          <PlusOutlined
            style={{ fontSize: "18px", color: "#1890ff", cursor: "pointer" }}
            onClick={handleAddAddress}
          />
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
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
                    {!address.isDefault && (
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#1890ff",
                          cursor: "pointer",
                          textDecoration: "underline",
                        }}
                        onClick={() => address._id && handleSetDefaultAddress(address._id)}
                      >
                        设为默认
                      </span>
                    )}
                    <EditOutlined
                      style={{ fontSize: "14px", color: "#1890ff", cursor: "pointer" }}
                      onClick={() => handleEditAddress(address)}
                    />
                    <Popconfirm
                      title="确定要删除这个地址吗？"
                      onConfirm={() => address._id && handleDeleteAddress(address._id)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <DeleteOutlined
                        style={{ fontSize: "14px", color: "#ff4d4f", cursor: "pointer" }}
                      />
                    </Popconfirm>
                  </div>
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

      {/* 地址编辑模态框 */}
      <AddressFormModal
        open={addressModalOpen}
        mode={addressModalMode}
        initialValues={editingAddress}
        onCancel={() => setAddressModalOpen(false)}
        onSuccess={handleSaveAddress}
      />
    </div>
  );
};

export default UserProfile;