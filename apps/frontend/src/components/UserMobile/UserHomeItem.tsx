import { Image } from "antd";
import type { Product } from "../../services/productService";
import { useNavigate } from "react-router-dom";


interface UserHomeItemProps {
  data: Product;
}

const UserHomeItem = ({ data }: UserHomeItemProps) => {

    const navigate = useNavigate();
  // 获取最低价格
  const minPrice = data?.skus?.length > 0 
    ? Math.min(...data.skus.map((sku) => sku.price))
    : 0;

  return (
    <div
        onClick = {()=>{
            navigate(`/customer/detail/product/${data?._id}`, {
                state: {
                    product: data,
                },
            });
        }}
      style={{
        width: "100%",
        backgroundColor: "#fff",
        borderRadius: "8px",
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
        marginBottom: "4px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 商品图片 */}
      <div
        style={{
          width: "100%",
          aspectRatio: "1",
          backgroundColor: "#fafafa",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <Image
          src={data?.images}
          alt={data?.productName || "商品图片"}
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
          padding: "14px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {/* 商品名称 */}
        <div
          style={{
            fontSize: "14px",
            fontWeight: "500",
            color: "#333",
            lineHeight: "1.4",
            display: "-webkit-box",
            // 官方叫「多行文本省略」
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            minHeight: "40px",
          }}
        >
          {data?.productName || "商品名称"}
        </div>

        {/* 价格 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "auto",
          }}
        >
          <span
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              color: "#ff4d4f",
              display: "inline-block",
            }}
          >
            ¥{minPrice.toFixed(2)}
          </span>
          {(data?.salesCount ?? 0) > 0 && (
            <span
              style={{
                fontSize: "12px",
                color: "#999",
                display: "inline-block",
              }}
            >
              已售 {data.salesCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserHomeItem;
