import { LeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import UserHomeDetailItem from "../../components/UserMobile/UserHomeDetailItem";
import { getHomeData } from "../../services/UserMobile/homeService";
import { useEffect, useState } from "react";
import { useLocation } from 'react-router-dom';
import type { Product } from "../../services/productService";

const UserHomeDetail = () => {
    const [data, setData] = useState<Product[]>([]);
    const navigate = useNavigate();
    const location = useLocation()
    const { product, cardInfo } = location.state || {};


    const handleProdocuts = (products:Product[])=>{
        if(products.length > 0 && products.find((item:Product)=>item._id === product._id)){
          const newProducts = [product, ...products.filter((item:Product)=>item._id !== product._id)]  
          setData(newProducts)
        }else{
          setData(products)
        }
    }
    const loadData = async  ()=>{
        const res = await getHomeData()
        if(res.code === 200){

          handleProdocuts(res.data.products);
            // setData(res.data.products);
            console.log("我是 product",product);
            console.log("我是 setData",res.data.products);
        }
    }
    useEffect(()=>{
        loadData();
    },[]);

    return (
        <div style={{
            position: "relative",
            width: "100%",
            height: "100vh",
            backgroundColor: "#f5f5f5",
            overflowY: "auto",
            scrollSnapType: "y mandatory",
            scrollBehavior: "smooth",
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
        }}>

    <LeftOutlined
        onClick={() => navigate(-1)}
        style={{
          position: "fixed",
          top: "30px",
          left: "30px",
          fontSize: "20px",
          color: "#333",
          cursor: "pointer",
          backgroundColor: "rgba(255, 255, 255, 0)",
          borderRadius: "50%",
          width: "32px",
          height: "32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          zIndex: 1000,
        }}
      />
      <div style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#f5f5f5",
      }}>
      {
        data && data?.map((item: Product, index: number)=>(
            <UserHomeDetailItem 
                key={item?._id} 
                data={item} 
                index={index}
            />
        ))
      }
        </div>
        </div>
    )
}

export default UserHomeDetail;