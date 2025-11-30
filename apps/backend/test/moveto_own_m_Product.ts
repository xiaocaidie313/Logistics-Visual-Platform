import mongoose from 'mongoose';
import ownMerchantProduct from '../src/models/ownmerchantproduct.js';
import Product from '../src/models/product.js';
import UserInfo from '../src/models/userinfo.js';

// MongoDB 连接配置
const MONGODB_URI = "mongodb://lms:123lms@47.109.143.184:27017/logistics";

const addMerchantProducts = async () => {
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
    
    // 查看所有商品
    const allProducts = await Product.find({});
    console.log(`\n=== 数据库中共有 ${allProducts.length} 个商品 ===`);
    if (allProducts.length > 0) {
      console.log('商品列表(前10个):');
      allProducts.slice(0, 10).forEach((product, index) => {
        console.log(`${index + 1}. ${product.productName} - merchantId: ${product.merchantId}`);
      });
    }

    // 使用第一个商户ID 或者使用指定的ID
    let merchantId = '6926d2154254b19e2f76f965';
    if (merchants.length > 0 && merchants[0] && merchants[0]._id) {
      merchantId = merchants[0]._id.toString();
    }
    console.log(`\n=== 使用商户ID: ${merchantId} ===`);
    
    // 1. 查找该商户的所有商品（尝试两种方式）
    let products = await Product.find({ merchantId: new mongoose.Types.ObjectId(merchantId) });
    
    // 如果没找到，尝试用字符串匹配
    if (products.length === 0) {
      console.log('尝试用字符串匹配 merchantId...');
      products = await Product.find({ merchantId: merchantId });
    }
    
    // 如果还是没找到，尝试查找所有商品看看 merchantId 的格式
    if (products.length === 0) {
      console.log('仍然没找到，检查商品中的 merchantId 格式...');
      const sampleProduct = await Product.findOne({});
      if (sampleProduct) {
        console.log('示例商品的 merchantId:', sampleProduct.merchantId);
        console.log('示例商品的 merchantId 类型:', typeof sampleProduct.merchantId);
        console.log('示例商品的 merchantId 是否为 ObjectId:', sampleProduct.merchantId instanceof mongoose.Types.ObjectId);
      }
    }
    
    console.log(`\n找到 ${products.length} 个商品`);
    
    if (products.length === 0) {
      console.log('该商户没有商品，无法创建商品集合');
      console.log('提示：请确认数据库中是否有该商户的商品数据');
      return;
    }
    
    // 2. 将 Mongoose 文档转换为普通对象（因为 ownMerchantProduct.products 需要的是 productSchema 格式）
    const productObjects = products.map(product => product.toObject());

    // 3. 创建或更新 ownMerchantProduct
    let ownMerchantProductDoc = await ownMerchantProduct.findOne({ 
      merchantId: new mongoose.Types.ObjectId(merchantId) 
    });
    
    if (!ownMerchantProductDoc) {
      ownMerchantProductDoc = new ownMerchantProduct({
        merchantId: new mongoose.Types.ObjectId(merchantId),
        products: productObjects as any, // 类型断言，因为 productSchema 和 Product 文档结构兼容
      });
      console.log('创建新的商户商品集合');

    } else {
      // 如果已存在，更新商品列表
      ownMerchantProductDoc.products = productObjects as any; // 类型断言
      console.log('更新已存在的商户商品集合');
    }

    await ownMerchantProductDoc.save();
    console.log('商户商品集合创建/更新成功');
    console.log('商户ID:', merchantId);
    console.log('商品数量:', productObjects.length);
    console.log('商品列表:');
    productObjects.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.productName} (${product.category}) - ${product.skus.length} 个SKU`);
    });
    await mongoose.disconnect()
    console.log('=====数据库连接已关闭=====')
  } catch (error) {
    console.error('错误:', error);
  } finally {
    await mongoose.disconnect();
    console.log('数据库连接已关闭');
  }
};

addMerchantProducts();