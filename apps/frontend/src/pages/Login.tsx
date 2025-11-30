import React, { useState } from "react";
import { Form, Input, Button, Card, message, Select } from "antd";
import {
  UserOutlined,
  LockOutlined,
  ShoppingOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import type { FormProps } from "antd";

interface LoginFormValues {
  username: string;
  password: string;
  role?: string;
}

interface LoginProps {
  onLoginSuccess?: (userInfo: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish: FormProps<LoginFormValues>["onFinish"] = async (values) => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:3002/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: values.username,
          password: values.password,
          role:values.role
        }),
      });

      const result = await response.json();
      console.log('result', result);

      if (result.code === 200) {
        message.success(result.message || "登录成功");
        // 保存用户信息到 localStorage
        localStorage.setItem("userInfo", JSON.stringify(result.data));
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("token", result.data.token);
        if (onLoginSuccess) {
          onLoginSuccess(result.data);
        } else {
          const role = result.data.role || values.role || "customer";
          if (role === "merchant") {
            navigate("/merchant");
          } else if (role === "admin") {
            navigate("/admin");
          } else {
            navigate("/customer");
          }
        }
      } else {
        message.error(result.message || "登录失败");
      }
    } catch (error) {
      console.error("登录错误:", error);
      message.error("登录失败，请检查网络连接");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "white",
        padding: "20px",
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: 400,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          borderRadius: "8px",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: 32,
          }}
        >
          <ShoppingOutlined
            style={{
              fontSize: 48,
              color: "#1890ff",
              marginBottom: 16,
            }}
          />
          <h1
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: "#333",
              margin: 0,
            }}
          >
            电商管理平台
          </h1>
          <p
            style={{
              color: "#666",
              marginTop: 8,
              fontSize: 14,
            }}
          >
            登录
          </p>
        </div>

        <Form name="login" onFinish={onFinish} autoComplete="off" size="large">
          <Form.Item
            name="username"
            rules={[{ required: true, message: "请输入用户名" }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: "#bfbfbf" }} />}
              placeholder="用户名"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "请输入密码" }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: "#bfbfbf" }} />}
              placeholder="密码"
            />
          </Form.Item>
          <Form.Item name="role">
            <Select
              placeholder="选择角色"
              style={{ width: '100%' }}
              options={[
                { value: "customer", label: "用户" },
                { value: "merchant", label: "商家" },
                { value: "admin", label: "管理员" },
              ]}
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              //   color="default" variant="solid"
              style={{
                height: 40,
                fontSize: 16,
                fontWeight: 500,
              }}
            >
              登录
            </Button>
          </Form.Item>

        </Form>
      </Card>
    </div>
  );
};

export default Login;
