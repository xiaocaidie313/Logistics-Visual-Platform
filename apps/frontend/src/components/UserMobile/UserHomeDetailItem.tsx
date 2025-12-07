import type { Product } from "../../services/productService";
import { Button, Image } from "antd";
import { useState, useEffect } from "react";
import "./adnimation/UserHomeDetailItem.css";
interface UserHomeDetailItemProps {
  data: Product;
  index?: number;
}

const UserHomeDetailItem = ({ data }: UserHomeDetailItemProps) => {

    const [loading, setLoading] = useState(true);
    useEffect(() => {
        // 使用 requestAnimationFrame 确保动画在下一帧开始
        const timer = setTimeout(() => {
            setLoading(false);
        }, 50); // 短暂延迟确保初始状态被应用
        return () => clearTimeout(timer);
    }, []);
  const minPrice =
    data?.skus?.length > 0 ? Math.min(...data.skus.map((sku) => sku.price)) : 0;

  return (
    <div
      className={`home-detail-item ${loading ? "loading" : ""}`}
    >
      {/* 商品图片 - 占据更多空间 */}
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
      </div>
    </div>
  );
};
export default UserHomeDetailItem;
