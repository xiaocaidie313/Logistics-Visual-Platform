import type { Product } from "../../services/productService";
import { Button, Image, message } from "antd";
import { useState, useEffect } from "react";
import {Modal} from "antd";
import {useNavigate} from "react-router-dom";
import { createOrder, type Order } from "../../services/UserMobile/orderService";
import { getUser } from "../../services/userService";
import genTrackorder from "../../utils/genTrackorder";
import genTradeOrder from "../../utils/genTradeOrder";
import "./adnimation/UserHomeDetailItem.css";

interface UserHomeDetailItemProps {
  data: Product;
  index?: number;
}

const UserHomeDetailItem = ({ data }: UserHomeDetailItemProps) => {

    const navigate = useNavigate();
    const [loading, setLoading] = useState<boolean>(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [addressList, setAddressList] = useState<any[]>([]);


    // 步骤1: 添加获取用户信息的函数
    const getUserId = () => {
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        try {
          const user = JSON.parse(userInfo);
          return user._id || user.id;
        } catch (e) {
          console.error('解析用户信息失败:', e);
          return null;
        }
      }
      return null;
    };

    // 从 API 获取最新的用户信息 
    const loadUserAddresses = async () => {
      const userId = getUserId();
      if (!userId) {
        return;
      }
      try {
        const response = await getUser(userId);
        if (response.code === 200 && response.data) {
          const addresses = response.data.addresses || [];
          setAddressList(addresses);
          // 更新 localStorage 中的用户信息
          const userInfo = localStorage.getItem('userInfo');
          if (userInfo) {
            try {
              const user = JSON.parse(userInfo);
              user.addresses = addresses;
              localStorage.setItem('userInfo', JSON.stringify(user));
            } catch (e) {
              console.error('更新用户信息失败:', e);
            }
          }
        }
      } catch (error) {
        console.error('获取用户地址失败:', error);
        // 如果 API 失败，回退到使用 localStorage
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
          try {
            const user = JSON.parse(userInfo);
            if (user.addresses && Array.isArray(user.addresses)) {
              setAddressList(user.addresses);
            }
          } catch (e) {
            console.error('解析用户信息失败:', e);
          }
        }
      }
    };

    // 在组件加载时获取最新的地址列表
    useEffect(() => {
      loadUserAddresses();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
        // 创建 购买订单
    const handelClick = async () => {
      try {
        // 步骤2: 检查用户是否登录
        const userId = getUserId();
        if (!userId) {
          message.error("请先登录");
          return;
        }
      // 在创建订单前，重新获取最新的地址信息（确保使用最新的默认地址）
   
        await loadUserAddresses();
        
        // 重新获取最新的地址列表（因为 loadUserAddresses 是异步的，需要从 state 获取）
        const userInfo = localStorage.getItem('userInfo');
        let currentAddressList: any[] = [];
        if (userInfo) {
          try {
            const user = JSON.parse(userInfo);
            currentAddressList = user.addresses || [];
          } catch (e) {
            console.error('解析用户信息失败:', e);
          }
        }
        
        // 如果还是空的，使用 state 中的地址列表
        if (currentAddressList.length === 0) {
          currentAddressList = addressList;
        }
        
        // 检查是否有地址
        if (!currentAddressList || currentAddressList.length === 0) {
          message.error("请先在个人资料页面添加收货地址");
          return;
        }
        
        // 获得交易订单数据
        const orderData = await genTradeOrder(data, currentAddressList, userId);
        // 步骤10: 显示加载状态
        setIsModalOpen(true);
        setLoading(true);
        if (!orderData) {
          message.error("请先添加收货地址");
          return;
        }
        const response = await createOrder(orderData as Omit<Order, '_id'>);
        console.log("创建订单响应:", response);

        // 步骤12: 处理响应结果
        if (response.code === 200) {  
          const savedOrder = response.data;
          // 注意：不再自动创建物流订单，等待商家发货时创建
          // 订单状态为 paid（已支付），等待商家发货
          
          message.success("订单创建成功，等待商家发货");
          setTimeout(() => {
            console.log("购买成功", response.data);
            setIsModalOpen(false);
            setLoading(false);
            navigate(-1); // 返回上一页
          }, 1000);
        } else {
          message.error(response.message || "购买失败");
          setIsModalOpen(false);
          setLoading(false);
        }
      } catch (error: unknown) {
        console.error("创建订单失败:", error);
        const errorMessage = error instanceof Error ? error.message : "创建订单失败，请重试";
        message.error(errorMessage);
        setIsModalOpen(false);
        setLoading(false);
      }
    }


    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(prev => !prev);
        }, 300); // 短暂延迟确保初始状态被应用
        return () => clearTimeout(timer);
    }, []);
  const minPrice =
    data?.skus?.length > 0 ? Math.min(...data.skus.map((sku) => sku.price)) : 0;

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 8px 32px 0 rgba(34, 21, 9, 0.4)",
      }}
      className={`home-detail-item ${loading ? "loading" : ""}`}
    >
      <div
        style={{
          width: "100%",
          flex: 1,
          minHeight: "50%",
          backgroundColor: "#fafafa",
          borderRadius: "8px",
          overflow: "hidden",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundImage: `url(${data.images})`,
          backgroundSize: "200% 200%",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          zIndex: 1,
        }}
      >
        <div className="glass-image-container"
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(34, 21, 9, 0.15)",
          borderRadius: "8px",
          overflow: "hidden",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 2
        }}
        >
        <Image
        
          src={data.images}
          alt={data.productName}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          

          }}
          preview={false}
        />
        </div>
      </div>

      {/* 商品信息 */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          flexShrink: 0,
        }}
      >
        {/* 商品名称 */}
        <div
          style={{
            fontSize: "16px",
            fontWeight: "600",
            color: "#333",
            lineHeight: "1.5",
          }}
        >
          {data?.productName || "商品名称"}
        </div>

        {data?.description && (
          <div
            style={{
              fontSize: "14px",
              color: "#666",
              lineHeight: "1.5",
            }}
          >
            {data.description}
          </div>
        )}

        <div
          style={{
            fontSize: "24px",
            fontWeight: "bold",
            color: "#ff4d4f",
            marginTop: "8px",
          }}
        >
          ¥{minPrice.toFixed(2)}
        </div>
      </div>

      {/* 操作按钮 */}
      <div
        style={{
          display: "flex",
          gap: "0",
          marginTop: "8px",
        }}
      >
        <Button
          type="default"
          style={{
            flex: 1,
            height: "44px",
            borderRadius: "8px 0 0 8px",
            borderColor: "#ffa940",
            color: "#ffa940",
            fontWeight: "500",
          }}
        >
          加入购物车
        </Button>
        <Button
          onClick={handelClick}
          type="primary"
          danger
          style={{
            flex: 1,
            height: "44px",
            borderRadius: "0 8px 8px 0",
            fontWeight: "500",
          }}
        >
          立即购买
        </Button>
        <Modal
          open={isModalOpen}
          onCancel={handelClick}
          footer={null}
          closable={false}
          centered
          width={300}
          className="purchase-success-modal"
          styles={{
            body: {
              padding: "12px",
              textAlign: "center",
            },
          }}
        >
          <Image
            src={data.images}
            alt={data.productName}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          <div style={{
            fontSize: "18px",
            fontWeight: "600",
            color: "#333",
            marginBottom: "16px",
          }}>
            购买成功！
          </div>
          <div style={{
            fontSize: "14px",
            color: "#666",
          }}>
            商品已添加到订单
          </div>
        </Modal>
      </div>
    </div>
  );
};
export default UserHomeDetailItem;
