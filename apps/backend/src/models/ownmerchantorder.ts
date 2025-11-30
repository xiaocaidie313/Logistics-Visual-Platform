import mongoose from 'mongoose'
import { orderSchema } from './order.js'
// merchant的订单集合

interface OwnMerchantOrder {
  merchantId: string;
  orders: typeof orderSchema[];
  totalAmount: number;
  totalQuantity: number;
}


const ownmerchantorderSchema = new mongoose.Schema({
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,   
    ref: 'UserInfo', // ref只是指向数据源
    required: true,
    index: true,
  },
  orders:{
    type:[orderSchema],
    required: true,
  },
//   totalAmount: {
//     type: Number,
//     required: true,
//     min: 0,
//   },
//   totalQuantity: {
//     type: Number,
//     required: true,
//     min: 0,
//   },
})  

const ownMerchantOrder = mongoose.model('own_M_Order',ownmerchantorderSchema);
export default ownMerchantOrder;