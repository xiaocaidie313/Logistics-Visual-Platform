// 更新所有待支付订单为已支付状态
import mongoose from 'mongoose';
import Order from '../src/models/order.js';

const MONGODB_URI = "mongodb://lms:123lms@47.109.143.184:27017/logistics";

const updatePendingOrders = async () => {
  try {
    // 连接数据库
    await mongoose.connect(MONGODB_URI);
    console.log('=====数据库连接成功=====');

    // 查找所有状态为 pending 的订单
    const pendingOrders = await Order.find({ status: 'pending' });
    console.log(`找到 ${pendingOrders.length} 个待支付订单`);

    if (pendingOrders.length === 0) {
      console.log('没有待支付的订单需要更新');
      await mongoose.disconnect();
      return;
    }

    // 更新所有 pending 订单为 paid，并设置支付时间
    const result = await Order.updateMany(
      { status: 'pending' },
      { 
        $set: { 
          status: 'paid',
          paymentTime: new Date()
        } 
      }
    );

    console.log('=====更新完成=====');
    console.log(`成功更新 ${result.modifiedCount} 个订单`);
    console.log(`匹配到 ${result.matchedCount} 个订单`);

    await mongoose.disconnect();
    console.log('=====数据库连接已关闭=====');
  } catch (error: unknown) {
    console.error('错误:', error);
    console.log('=====更新失败=====');
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
};

// 执行更新
console.log('=====开始执行更新订单状态脚本=====');
updatePendingOrders().catch((error) => {
  console.error('未捕获的错误:', error);
  process.exit(1);
});

