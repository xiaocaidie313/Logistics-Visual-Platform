// 添加订单脚本
import mongoose from 'mongoose';
import Order from '../src/models/order.js';
import UserInfo from '../src/models/userinfo.js';
import Product from '../src/models/product.js';

const MONGODB_URI = "mongodb://lms:123lms@47.109.143.184:27017/logistics";
const merchantId = '692b16f39c40f2f39f6f629f';
const customerId = '692b18c008eae97f7862f9c3';
// 生成订单Id
const generateOrderId = () => {
  // 使用时间戳 + 随机数确保唯一性
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD${timestamp}${random}`;
};

// 添加订单函数
const addOrder = async () => {
  try {
    // 连接数据库
    await mongoose.connect(MONGODB_URI);
    console.log('=====数据库连接成功=====');

    // 1. 查找用户（购买者）
    const customer = await UserInfo.findById(customerId);
    if (!customer || !customer._id) {
      console.log('错误：找不到指定的客户，请检查客户ID');
      return;
    }
    console.log(`使用客户: ${customer.username} (ID: ${customer._id})`);

    // 2. 查找商户
    const merchant = await UserInfo.findById(merchantId);
    if (!merchant || !merchant._id) {
      console.log('错误：找不到指定的商户，请检查商户ID');
      return;
    }
    console.log(`使用商户: ${merchant.username} (ID: ${merchant._id})`);

    // 3. 查找该商户的商品
    const products = await Product.find({ merchantId: merchant._id });
    if (products.length === 0) {
      console.log('错误：该商户没有商品，请先创建商品');
      return;
    }
    console.log(`找到 ${products.length} 个商品`);

    // 4. 随机选择商品创建订单项
    const items: Array<{
      productId: string;
      skuid: string;
      skuName: string;
      price: number;
      quantity: number;
      totalPrice: number;
      images: string[];
    }> = [];
    let totalAmount = 0;

    // 随机选择1-3个商品
    const numberOfItems = Math.floor(Math.random() * 3) + 1; // 1到3个商品
    const selectedProducts: typeof products = [];
    
    // 随机选择不重复的商品
    const availableProducts = [...products];
    for (let i = 0; i < numberOfItems && availableProducts.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * availableProducts.length);
      const selectedProduct = availableProducts.splice(randomIndex, 1)[0];
      if (selectedProduct && selectedProduct.skus && selectedProduct.skus.length > 0) {
        selectedProducts.push(selectedProduct);
      }
    }

    if (selectedProducts.length === 0) {
      console.log('错误：没有可用的商品或商品没有SKU');
      return;
    }

    console.log(`随机选择了 ${selectedProducts.length} 个商品`);

    // 为每个选中的商品随机选择一个SKU
    selectedProducts.forEach((product, index) => {
      if (!product._id || !product.skus || product.skus.length === 0) {
        return;
      }

      // 随机选择一个SKU
      const randomSkuIndex = Math.floor(Math.random() * product.skus.length);
      const selectedSku = product.skus[randomSkuIndex];
      
      if (!selectedSku) {
        return;
      }

      // 随机购买数量（1-5件）
      const quantity = Math.floor(Math.random() * 5) + 1;
      const itemTotalPrice = selectedSku.price * quantity;

      // 获取商品图片（商品级别的 images 字段）
      const productImages = product.images ? [product.images] : [];
      
      items.push({
        productId: product._id.toString(),
        skuid: selectedSku._id?.toString() || selectedSku.skuid || `SKU${Date.now() + index}`,
        skuName: selectedSku.skuName,
        price: selectedSku.price,
        quantity: quantity,
        totalPrice: itemTotalPrice,
        images: productImages // 使用商品图片数组
      });

      totalAmount += itemTotalPrice;
      console.log(`  - 商品: ${product.productName}, SKU: ${selectedSku.skuName}, 数量: ${quantity}, 单价: ${selectedSku.price}, 小计: ${itemTotalPrice}`);
    });

    // 5. 获取用户的默认地址
    const defaultAddress = customer.addresses?.find((addr: { isDefault?: boolean }) => addr.isDefault) || customer.addresses?.[0];
    if (!defaultAddress || !customer._id || !merchant._id) {
      console.log('错误：用户没有地址或ID无效，请先添加地址');
      return;
    }

    // 6. 构建完整地址字符串
    const fullAddress = `${defaultAddress.province}${defaultAddress.city}${defaultAddress.district}${defaultAddress.street || ''}${defaultAddress.detailAddress}`;

    // 获取商户地址
    const merchantAddress = merchant.addresses?.[0];
    const senderAddress = merchantAddress 
      ? `${merchantAddress.province || '北京市'}${merchantAddress.city || '北京市'}${merchantAddress.district || '海淀区'}${merchantAddress.detailAddress || '中关村大街1号'}`
      : '北京市北京市海淀区中关村大街1号';

    // 7. 获取第一个商品信息（用于兼容字段）
    const firstItem = items[0];
    const firstProduct = selectedProducts[0];
    
    // 8. 创建订单数据（同时包含新旧字段格式）
    const orderData = {
      orderId: generateOrderId(),
      userId: customer._id,
      merchantId: merchant._id,
      // 新格式：items 数组
      items: items,
      totalAmount: totalAmount,
      // 新格式：收货地址对象
      shippingAddress: {
        contactName: defaultAddress.contactName,
        contactPhone: defaultAddress.contactPhone,
        province: defaultAddress.province,
        city: defaultAddress.city,
        district: defaultAddress.district,
        street: defaultAddress.street || '',
        detailAddress: defaultAddress.detailAddress,
        fullAddress: fullAddress
      },
      // 新格式：发货地址字符串
      senderAddress: senderAddress,
      // 兼容旧格式：扁平字段
      skuname: firstItem?.skuName || firstProduct?.productName || '',
      images: firstProduct?.images || firstItem?.images?.[0] || '', // 商品图片或第一个订单项的图片
      price: firstItem?.price || 0,
      amount: items.reduce((sum, item) => sum + item.quantity, 0),
      totprice: totalAmount,
      useraddress: fullAddress,
      sendaddress: senderAddress,
      // 时间字段
      ordertime: new Date(),
      // 订单状态
      status: 'pending',
      // 备注
      remark: '测试订单'
    };

    // 9. 检查订单ID是否已存在，如果存在则重新生成
    let orderId = generateOrderId();
    let existingOrder = await Order.findOne({ orderId });
    let retryCount = 0;
    while (existingOrder && retryCount < 10) {
      orderId = generateOrderId();
      existingOrder = await Order.findOne({ orderId });
      retryCount++;
    }
    if (existingOrder) {
      console.log('错误：无法生成唯一的订单ID');
      return;
    }
    orderData.orderId = orderId;

    // 10. 处理数据库索引问题（删除有问题的 id_1 索引）
    try {
      const db = mongoose.connection.db;
      if (db) {
        const ordersCollection = db.collection('orders');
        // 尝试删除有问题的 id_1 索引
        try {
          await ordersCollection.dropIndex('id_1');
          console.log('已删除有问题的 id_1 索引');
        } catch (indexError: unknown) {
          // 索引不存在或已删除，忽略错误
          const error = indexError as { code?: number; codeName?: string; message?: string };
          if (error.code !== 27 && error.codeName !== 'IndexNotFound') {
            console.log('删除索引时出现警告（可忽略）:', error.message);
          }
        }
      }
    } catch {
      // 忽略索引操作错误，继续执行
      console.log('索引操作警告（可忽略）');
    }

    // 11. 创建并保存订单
    const newOrder = new Order(orderData);
    const savedOrder = await newOrder.save();

    console.log('=====订单添加成功=====');
    console.log('订单ID:', savedOrder.orderId);
    console.log('客户:', customer.username);
    console.log('商户:', merchant.username);
    console.log('订单项数量:', savedOrder.items.length);
    console.log('总金额:', savedOrder.totalAmount);
    console.log('订单状态:', savedOrder.status);
    console.log('完整订单信息:', savedOrder);

    await mongoose.disconnect();
    console.log('=====数据库连接已关闭=====');
  } catch (error: unknown) {
    console.error('错误:', error);
    console.log('=====订单添加失败=====');
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
};

// 执行添加订单
console.log('=====开始执行添加订单脚本=====');
addOrder().catch((error) => {
  console.error('未捕获的错误:', error);
  process.exit(1);
});

