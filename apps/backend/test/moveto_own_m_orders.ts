import mongoose from 'mongoose';
import ownMerchantOrder from '../src/models/ownmerchantorder.js';
import UserInfo from '../src/models/userinfo.js';
import Order from '../src/models/order.js';

const  Id = '6926d2154254b19e2f76f965';
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
      orders.slice(0, 10).forEach((order: any, index: number) => {
        console.log(`${index + 1}. ${order.orderId} - merchantId: ${order.merchantId || 'N/A'}`);
      });
    }

    // 使用第一个商户ID 或者使用指定的ID
    let merchantId = Id;
    if (merchants.length > 0 && merchants[0] && merchants[0]._id) {
      merchantId = merchants[0]._id.toString();
    }
    console.log(`\n=== 使用商户ID: ${merchantId} ===`);
    
    // 1. 查找该商户的所有订单（尝试两种方式）
    let ordersData = await Order.find({ merchantId: new mongoose.Types.ObjectId(merchantId) });
    
    // 如果没找到，尝试用字符串匹配
    if (ordersData.length === 0) {
      console.log('尝试用字符串匹配 merchantId...');
      ordersData = await Order.find({ merchantId: merchantId });
    }
    
    // 如果还是没找到，尝试查找所有订单看看 merchantId 的格式
    if (ordersData.length === 0) {
      console.log('仍然没找到，检查订单中的 merchantId 格式...');
      const sampleOrder = await Order.findOne({});
      if (sampleOrder) {
        console.log('示例订单的 merchantId:', sampleOrder.merchantId);
        console.log('示例订单的 merchantId 类型:', typeof sampleOrder.merchantId);
        console.log('示例订单的 merchantId 是否为 ObjectId:', sampleOrder.merchantId instanceof mongoose.Types.ObjectId);
      }
    }
    
    console.log(`\n找到 ${ordersData.length} 个订单`);
    
    if (ordersData.length === 0) {
      console.log('该商户没有订单，无法创建订单集合');
      console.log('提示：请确认数据库中是否有该商户的订单数据');
      return;
    }
    // 2. 将 Mongoose 文档转换为普通对象（因为 ownMerchantOrder.orders 需要的是 orderSchema
    const ordersDataArray = ordersData.map(order => order.toObject());
    
    // 计算总金额和总数量（虽然模型中被注释了，但可以用于日志）
    const totalAmount = ordersDataArray.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const totalQuantity = ordersDataArray.reduce((sum, order) => 
      sum + (order.items?.reduce((qty: number, item: any) => qty + (item.quantity || 0), 0) || 0), 0
    );
    
    let ownMerchantOrderDoc = await ownMerchantOrder.findOne({ merchantId: new mongoose.Types.ObjectId(merchantId) });
    if (!ownMerchantOrderDoc) {
        ownMerchantOrderDoc = new ownMerchantOrder({
          merchantId: new mongoose.Types.ObjectId(merchantId),
          orders: ordersDataArray as any, // 类型断言，
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