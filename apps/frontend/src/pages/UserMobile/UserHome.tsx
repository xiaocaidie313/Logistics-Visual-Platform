import { Masonry } from "antd";
import UserHomeItem from "../../components/UserMobile/UserHomeItem";
import { getHomeData } from "../../services/UserMobile/homeService";
import { useEffect, useState } from "react";
import React from "react";
import type { Product } from "../../services/productService";

const UserHome: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Product[]>([]);

  const loadData = async () => {
    setLoading(true);
    const res = await getHomeData();
    if (res.code === 200) {
      setData(res.data.products);
      console.log(res.data.products);
      setLoading(false);
    }
  };
  useEffect(() => {
    loadData();
  }, []);
  if (loading) {
    return <div>推荐加载中...</div>;
  }
  return (
    <div style={{ 
      width: "calc(100% + 28px)",
      marginLeft: "-14px",
      marginRight: "-14px",
      paddingLeft: "8px",
      paddingRight: "8px",
    }}>
      <Masonry
        columns={2}
        gutter={8}
        items={data.map((item, index) => ({
          key: item._id || `item-${index}`,
          data: item,
        }))}
        itemRender={({ data }) => <UserHomeItem data={data} />}
      />
    </div>
  );
};

export default UserHome;
