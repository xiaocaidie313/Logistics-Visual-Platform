import mongoose from 'mongoose'
import {productSchema} from './product.js'
// merchant的商品集合
const ownmerchantproductSchema = new mongoose.Schema({
    merchantId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserInfo',
        required:true,
    },
    products:{
        type:[productSchema],
        required:true,
    }
})

const ownMerchantProduct = mongoose.model('own_M_Product',ownmerchantproductSchema);
export default ownMerchantProduct;