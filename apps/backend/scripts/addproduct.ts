import mongoose from 'mongoose'
import Product from '../src/models/product.js'

const MONGODB_URI = "mongodb://lms:123lms@47.109.143.184:27017/logistics";
const merchantId = '692b172bef33d637d3b2b64a'

const addProduct = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('=====数据库连接成功=====');

        const newProduct = new Product({
            productName: 'mikasaV300w',
            category: '体育用品',
            description: 'mikasa米卡萨排球v300w官方旗舰店正品v200w中考学生训练比赛专用',
            images: 'http://47.109.143.184/img/mikasav300.png',
            skus: [
                {
                    skuName: 'V330W【礼物版】赠-送礼手提袋',
                    price: 254
                    ,                    
                    stock: 10000,
                    attributes: {
                        color: '',
                        // size: 'S',
                    },
                }
            ],
            status: 'active',
            salesCount: 10200,
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