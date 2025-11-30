import mongoose from 'mongoose';
import ownMerchantOrder from '../src/models/ownmerchantorder.js';
import UserInfo from '../src/models/userinfo.js';
import Order from '../src/models/order.js';

const  Id = '692b16845c3f70d9071f33ed';
// MongoDB 连接配置
const MONGODB_URI = "mongodb://lms:123lms@47.109.143.184:27017/logistics";

const moveto_own_m_orders = async () => {
  try {
    // 连接数据库
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB 连接成功');

    // 先查看所有商户
    const merchants = await UserInfo.find({ role: 'merchant' });
    console.log('\n=== 数据库中的商户列表 ===');
    merchants.forEach((merchant, index) => {
      console.log(`${index + 1}. ID: ${merchant._id}, 用户名: ${merchant.username}`);
    });
    const orders = await Order.find({});    
    // 查看所有订单
    console.log(`\n=== 数据库中共有 ${orders.length} 个订单 ===`);
    if (orders.length > 0) {
      console.log('订单列表(前10个):');
      orders.slice(0,20).forEach((order: any, index: number) => {
        console.log(`${index + 1}. ${order.orderId} - merchantId: ${order.merchantId || 'N/A'}`);
      });
    }

    // 使用第一个商户ID 或者使用指定的ID
    const  merchantId = Id;
    // if (merchants.length > 0 && merchants[0] && merchants[0]._id) {
    //   merchantId = merchants[0]._id.toString();
    // }
    console.log(`\n=== 使用商户ID: ${merchantId} ===`);
    
    // 先检查一个包含该 merchantId 的订单，看看实际存储格式
    const sampleOrderWithMerchant = orders.find((order) => {
      if (!order.merchantId) return false;
      const orderMerchantIdStr = order.merchantId.toString();
      return orderMerchantIdStr === merchantId;
    });
    
    if (sampleOrderWithMerchant) {
      console.log('找到匹配的订单示例:');
      console.log('  merchantId 值:', sampleOrderWithMerchant.merchantId);
      console.log('  merchantId 类型:', typeof sampleOrderWithMerchant.merchantId);
      console.log('  merchantId 是否为 ObjectId:', sampleOrderWithMerchant.merchantId instanceof mongoose.Types.ObjectId);
      console.log('  merchantId toString():', sampleOrderWithMerchant.merchantId.toString());
    }
    
    // 1. 直接从数据库查询该商户的订单（确保获取完整数据）
    let ordersData = await Order.find({ merchantId: new mongoose.Types.ObjectId(merchantId) });
    console.log(`使用 ObjectId 查询找到 ${ordersData.length} 个订单`);
    
    // 如果没找到，尝试用字符串匹配
    if (ordersData.length === 0) {
      console.log('尝试用字符串匹配 merchantId...');
      ordersData = await Order.find({ merchantId: merchantId });
      console.log(`使用字符串查询找到 ${ordersData.length} 个订单`);
    }
    
    // 如果还是没找到，从已获取的订单数组中过滤
    if (ordersData.length === 0) {
      console.log('尝试从已获取的订单中过滤...');
      ordersData = orders.filter((order) => {
        if (!order.merchantId) return false;
        const orderMerchantIdStr = order.merchantId.toString();
        return orderMerchantIdStr === merchantId;
      });
      console.log(`从已获取的订单中过滤找到 ${ordersData.length} 个订单`);
    }
    
    console.log(`\n找到 ${ordersData.length} 个订单`);
    
    if (ordersData.length === 0) {
      console.log('该商户没有订单，无法创建订单集合');
      console.log('提示：请确认数据库中是否有该商户的订单数据');
      return;
    }
    
    // 检查第一个订单的数据结构
    if (ordersData.length > 0 && ordersData[0]) {
      const firstOrder = ordersData[0];
      console.log('\n=== 检查第一个订单的数据结构 ===');
      console.log('orderId:', firstOrder.orderId);
      console.log('totalAmount:', firstOrder.totalAmount);
      console.log('senderAddress:', firstOrder.senderAddress);
      console.log('shippingAddress:', firstOrder.shippingAddress);
      console.log('items 数量:', firstOrder.items?.length || 0);
      if (firstOrder.items && firstOrder.items.length > 0) {
        console.log('第一个 item:', JSON.stringify(firstOrder.items[0], null, 2));
      }
    }
    
    // 2. 将 Mongoose 文档转换为普通对象（确保保留所有嵌套字段）
    const ordersDataArray = ordersData
      .map(order => {
        // 使用 toObject() 并确保保留所有字段，包括嵌套对象
        const orderObj = order.toObject({ 
          flattenMaps: false,  // 保留 Map 类型
          virtuals: false,     // 不包含虚拟字段
          getters: true,       // 包含 getter
        });
        
        // 移除顶层 _id 和 __v（子文档保留自己的 _id）
        if ('_id' in orderObj) {
          delete (orderObj as { _id?: unknown })._id;
        }
        if ('__v' in orderObj) {
          delete (orderObj as { __v?: unknown }).__v;
        }
        
        return orderObj;
      })
      .filter(orderObj => {
        // 过滤掉不完整的订单数据
        const hasRequiredFields = 
          orderObj.orderId &&
          orderObj.shippingAddress &&
          orderObj.shippingAddress.contactName &&
          orderObj.shippingAddress.contactPhone &&
          orderObj.shippingAddress.province &&
          orderObj.shippingAddress.city &&
          orderObj.shippingAddress.district &&
          orderObj.shippingAddress.detailAddress &&
          orderObj.shippingAddress.fullAddress &&
          orderObj.senderAddress &&
          orderObj.totalAmount !== undefined &&
          orderObj.items &&
          orderObj.items.length > 0;
        
        if (!hasRequiredFields) {
          console.warn(`警告: 订单 ${orderObj.orderId || '未知'} 数据不完整，已跳过`);
          console.warn(`  缺少字段检查:`, {
            orderId: !!orderObj.orderId,
            shippingAddress: !!orderObj.shippingAddress,
            contactName: !!orderObj.shippingAddress?.contactName,
            contactPhone: !!orderObj.shippingAddress?.contactPhone,
            province: !!orderObj.shippingAddress?.province,
            city: !!orderObj.shippingAddress?.city,
            district: !!orderObj.shippingAddress?.district,
            detailAddress: !!orderObj.shippingAddress?.detailAddress,
            fullAddress: !!orderObj.shippingAddress?.fullAddress,
            senderAddress: !!orderObj.senderAddress,
            totalAmount: orderObj.totalAmount !== undefined,
            items: orderObj.items?.length > 0,
          });
        }
        
        return hasRequiredFields;
      });
    
    console.log(`\n过滤后有效订单数量: ${ordersDataArray.length} (原始: ${ordersData.length})`);
    
    if (ordersDataArray.length === 0) {
      console.log('没有有效的订单数据，无法创建订单集合');
      console.log('提示：请检查订单数据是否完整（包含所有必需字段）');
      return;
    }
    
    // 计算总金额和总数量（虽然模型中被注释了，但可以用于日志）
    const totalAmount = ordersDataArray.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const totalQuantity = ordersDataArray.reduce((sum, order) => 
      sum + (order.items?.reduce((qty: number, item: any) => qty + (item.quantity || 0), 0) || 0), 0
    );
    
    let ownMerchantOrderDoc = await ownMerchantOrder.findOne({ merchantId: new mongoose.Types.ObjectId(merchantId) });
    if (!ownMerchantOrderDoc) {
        ownMerchantOrderDoc = new ownMerchantOrder({
          merchantId: new mongoose.Types.ObjectId(merchantId),
          orders: ordersDataArray as any, // 类型断言
        });
        console.log('创建新的商户订单集合');
  
      } else {
        // 如果已存在，更新订单列表
        (ownMerchantOrderDoc.orders as any) = ordersDataArray;
        console.log('更新已存在的商户订单集合');
      }
      
      console.log(`总金额: ${totalAmount}, 总数量: ${totalQuantity}`);
      // 3. 保存商户订单集合
      await ownMerchantOrderDoc.save();
      console.log('商户订单集合创建/更新成功');
      console.log('商户ID:', ownMerchantOrderDoc.merchantId);
      console.log('订单数量:', ownMerchantOrderDoc.orders.length);
      console.log('订单列表:');
      ownMerchantOrderDoc.orders.forEach((order: any, index: number) => {
        console.log(`  ${index + 1}. ${order.orderId} (${order.status}) - ${order.items?.length || 0} 个商品`);
      });
      console.log('=====商户订单集合创建/更新成功=====');       
  } catch (error) {
    console.error('错误:', error);
  } finally {
    // 确保断开数据库连接
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('=====数据库连接已关闭=====');
    }
  }
};

moveto_own_m_orders();