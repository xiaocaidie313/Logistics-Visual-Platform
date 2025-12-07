import { Order } from "../../services/UserMobile/orderService";
import { Image } from "antd";
// 和vue一样 ?
// import { useRouter } from "next/router";
import { useNavigate } from "react-router-dom";

interface UserOrderItemProps {
  order: Order;
}

const UserOrderItem = ({ order }: UserOrderItemProps) => {
  const items = order.items;
  const navigate = useNavigate();
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        backgroundColor: "white",
        padding: "16px",
        marginBottom: "10px",
        borderRadius: "18px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
      }}
    >
      {items.map((item, index) => {
        return (
          <div
            onClick={() => {  
              console.log(order);
              navigate(`/customer/detail/ordertrack/${order?.orderId}`, {
                // 直接吧item 带走  
                state: {
                  order: order,
                },
              });
            }}
            key={item.skuid || index}
            style={{
              display: "flex",
              width: "100%",
              cursor: "pointer",
              //  判断是否还有下一个
              marginBottom: index < items.length - 1 ? "16px" : "0",
              paddingBottom: index < items.length - 1 ? "16px" : "0",
              borderBottom:
                index < items.length - 1 ? "1px solid #f0f0f0" : "none",
            }}
          >
            <Image
              src={item?.images?.[0]}
              alt={item.skuName}
              width={80}
              height={80}
              style={{
                objectFit: "contain",
                borderRadius: "8px",
                backgroundColor: "#fafafa",
                flexShrink: 0,
              }}
            />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                marginLeft: "12px",
                justifyContent: "space-between",
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
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#333",
                    margin: 0,
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    lineHeight: "1.4",
                    marginRight: "8px",
                  }}
                >
                  {item?.skuName}
                </p>
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: "bold",
                    color: "#ff4d4f",
                    margin: 0,
                    whiteSpace: "nowrap",
                  }}
                >
                  ¥{item?.price?.toFixed(2)}
                </p>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    color: "#999",
                  }}
                >
                  数量: {item?.quantity}
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#333",
                  }}
                >
                  小计: ¥{item?.totalPrice?.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default UserOrderItem;
