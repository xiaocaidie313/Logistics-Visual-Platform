import { getMerchantDetail } from "../services/UserMobile/orderService";


const formAddress = (address:object) =>{
    const { province, city, district, detailAddress } = address as { province: string, city: string, district: string, detailAddress: string };
    return `${province} ${city} ${district} ${detailAddress}`;

  }

const genTradeOrder = async (data: any, addressList: any, userId: string) => {
       // 步骤4: 选择最低价的SKU
       const selectedSku = data.skus.reduce((min: any, sku: any) => 
        sku.price < min.price ? sku : min
      );

      // 步骤5: 生成订单ID
      const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // 步骤6: 计算订单金额
      const quantity = 1;
      const totalPrice = selectedSku.price * quantity;
      const totalAmount = totalPrice;

      // 步骤7: 构建订单项数组
      const skuId = (selectedSku as { _id?: string; skuid?: string })._id || 
                    (selectedSku as { _id?: string; skuid?: string }).skuid || 
                    `SKU-${Date.now()}`;
      
      const orderItems = [{
        productId: data._id || "",
        skuid: skuId,
        skuName: selectedSku.skuName,
        price: selectedSku.price,
        quantity: quantity,
        totalPrice: totalPrice,
        images: data.images ? [data.images] : [],
      }];

      // 步骤8: 构建收货地址 - 优先使用默认地址
      console.log("addressList",addressList);
      
      // 查找默认地址，如果没有默认地址则使用第一个地址
      const defaultAddress = addressList.find((addr: any) => addr.isDefault) || addressList[0];
      
      if (!defaultAddress) {
        console.error("请先添加收货地址");
        return null;
      }
      
      const shippingAddress = {
        contactName: defaultAddress.contactName || '',
        contactPhone: defaultAddress.contactPhone || '',
        province: defaultAddress.province || '',
        city: defaultAddress.city || '',
        district: defaultAddress.district || '',
        detailAddress: defaultAddress.detailAddress || '',
        fullAddress: formAddress(defaultAddress) || '' ,
      };
      
      if (!shippingAddress.fullAddress) {
        console.error("请先添加收货地址");
        return null;
      }
      // 步骤8.5: 获取商家地址
      let senderAddress = "发货地址"; // 默认值
      try {
        const merchantResponse = await getMerchantDetail(data.merchantId);
        console.log("查找商家", merchantResponse);
        if (merchantResponse.code === 200 && merchantResponse.data?.addresses) {
          const merchantAddress = merchantResponse.data.addresses[0] || {};
          console.log("商家地址", merchantAddress);
          // 格式化商家地址为字符串
          senderAddress = [
            merchantAddress.province || '',
            merchantAddress.city || '',
            merchantAddress.district || '',
            merchantAddress.detailAddress || ''
          ].filter(Boolean).join(" ");
        }
      } catch (error) {
        console.warn("获取商家地址失败，使用默认地址:", error);
        // 如果获取失败，继续使用默认地址
      }

      // 步骤9: 构建完整的订单数据
      return  {
        orderId: orderId,
        userId: userId,
        merchantId: data.merchantId,
        items: orderItems,
        totalAmount: totalAmount,
        shippingAddress: shippingAddress,
        senderAddress: senderAddress,
        useraddress: shippingAddress.fullAddress,
        sendaddress: senderAddress,
        status: "pending",
        orderTime: new Date().toISOString(),
        ordertime: new Date().toISOString(), // 兼容后端字段
        skuname: selectedSku.skuName,
        images: data.images || "",
        price: selectedSku.price,
        amount: quantity,
        totprice: totalPrice,
      };
}

export default genTradeOrder;