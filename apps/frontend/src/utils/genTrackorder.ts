import { createTrack } from "../services/UserMobile/orderService";

const logisticsCompanyList = {
    "顺丰速运":"SF",
    "圆通速递":"YTO",
    "中通快递":"ZTO",
    "韵达快递":"YD",
    "申通快递":"STO",
    "邮政快递":"YZ",
    "京东快递":"JD",
    "极兔速递":"JT",
}
const genLogisticsCompany = (): string => {
    const keys = Object.keys(logisticsCompanyList);
    return keys[Math.floor(Math.random() * keys.length)] || "顺丰速运";
}

const genLogisticsNumber = (companyName: string) => {
    // 获取公司代码
    const companyCode = logisticsCompanyList[companyName as keyof typeof logisticsCompanyList] || "SF";
    return `${companyCode}${Date.now()}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
}



    // 创建物流订单
const createTrackOrder = async (orderId: string, sendAddress: string, userAddress: string) => {
        try {
          // 生成物流公司名称
          const logisticsCompany = genLogisticsCompany();
          // 生成物流单号
          const trackData = {
            id: `T-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            orderId: orderId,
            logisticsCompany: logisticsCompany, // 物流公司名称
            logisticsNumber: genLogisticsNumber(logisticsCompany), // 使用公司代码生成单号
            logisticsStatus: "shipped",
            orderTime: new Date().toISOString(),
            sendAddress: sendAddress,
            userAddress: userAddress,
          };
  
          const trackResponse = await createTrack(trackData);
          console.log("创建物流订单响应:", trackResponse);
          return trackResponse;
        } catch (error: unknown) {
          console.error("创建物流订单失败:", error);
          const errorMessage = error instanceof Error ? error.message : "创建物流订单失败";
          throw new Error(errorMessage);
        }
      };
const genTrackorder = async (savedOrder: any, orderData: any) => {
    const orderId = savedOrder.orderId || orderData.orderId;
    // 获取发货地址和收货地址
    const sendAddress = orderData.senderAddress || orderData.sendaddress || '';
    const userAddress = orderData.useraddress || orderData.shippingAddress?.fullAddress || '';
    
    if (!sendAddress || !userAddress) {
        console.error("地址信息不完整:", { sendAddress, userAddress });
        throw new Error("地址信息不完整，无法创建物流订单");
    }
    
    try {
        const trackResponse = await createTrackOrder(orderId, sendAddress, userAddress);
        console.log("创建物流订单响应:", trackResponse);
        return trackResponse;
    } catch (error: unknown) {
        console.error("创建物流订单失败:", error);
        const errorMessage = error instanceof Error ? error.message : "创建物流订单失败";
        throw new Error(errorMessage);
    }
}

export default genTrackorder;