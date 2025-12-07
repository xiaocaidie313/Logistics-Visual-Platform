// 清理测试订单脚本
import mongoose from 'mongoose';
import Order from '../src/models/order.js';

const MONGODB_URI = "mongodb://lms:123lms@47.109.143.184:27017/logistics";

// 清理没有 images 的订单函数
const cleanTestOrders = async () => {
  try {
    // 连接数据库
    await mongoose.connect(MONGODB_URI);
    console.log('=====数据库连接成功=====');

    // 1. 先查询有多少没有 images 的订单
    // 检查条件：images 为空字符串、null 或不存在
    const query = {
      $or: [
        { images: '' },                    // 空字符串
        { images: null },                  // null
        { images: { $exists: false } }     // 字段不存在
      ]
    };
    
    const ordersToDelete = await Order.find(query);
    console.log(`找到 ${ordersToDelete.length} 个没有 images 的订单`);
    
    if (ordersToDelete.length === 0) {
      console.log('没有找到需要删除的订单');
      await mongoose.disconnect();
      return;
    }

    // 2. 显示前5个订单的信息（预览）
    console.log('\n=====订单预览（前5个）=====');
    ordersToDelete.slice(0, 5).forEach((order, index) => {
      console.log(`${index + 1}. 订单ID: ${order.orderId}, 创建时间: ${order.ordertime}, 状态: ${order.status}, 金额: ${order.totalAmount}, images: "${order.images}"`);
    });
    if (ordersToDelete.length > 5) {
      console.log(`... 还有 ${ordersToDelete.length - 5} 个订单`);
    }

    // 3. 删除所有没有 images 的订单
    console.log('\n=====开始删除订单=====');
    const result = await Order.deleteMany(query);
    
    console.log('=====清理完成=====');
    console.log(`成功删除了 ${result.deletedCount} 个订单`);

    // 4. 验证删除结果
    const remainingOrders = await Order.find(query);
    console.log(`剩余没有 images 的订单数量: ${remainingOrders.length}`);

    // 2. 关闭数据库连接
    await mongoose.disconnect();
    console.log('=====数据库连接已关闭=====');
  } catch (error: unknown) {
    console.error('=====清理失败=====');
    console.error('错误:', error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
};

// 执行清理
console.log('=====开始执行清理没有 images 的订单脚本=====');
console.log('警告：此操作将删除所有 images 为空或不存在的订单！');
cleanTestOrders().catch((error) => {
  console.error('未捕获的错误:', error);
  process.exit(1);
});

