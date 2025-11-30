import mongoose from 'mongoose'
import Product from '../src/models/product.js'

const MONGODB_URI = "mongodb://lms:123lms@47.109.143.184:27017/logistics";
const merchantId = '692b172bef33d637d3b2b64a'

const addProduct = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('=====数据库连接成功=====');

        const newProduct = new Product({
            productName: '弱水时砂琉璃Ultra',
            category: '蓝牙耳机',
            description: '弱水时砂琉璃Ultra降噪入耳式降噪蓝牙耳机2025新款耳机琉璃x升级',
            images: 'http://47.109.143.184/img/弱水时砂琉璃Ultra.png',
            skus: [
                {
                    skuName: '弱水时砂琉璃Ultra-标准装',
                    price: 249,
                    stock: 100,
                    attributes: {
                        color: '浅云白',
                        // size: 'S',
                    },
                }
            ],
            status: 'active',
            salesCount: 1200,
            merchantId: new mongoose.Types.ObjectId(merchantId),
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        console.log('=====商品增加成功=====', newProduct);
        await newProduct.save();
        console.log('=====商品增加成功=====');
    } catch (error) {
        console.error('=====数据库连接失败=====', error);
    }
}
//增加商品
addProduct();