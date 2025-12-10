import mongoose from 'mongoose';

interface OrderItem {
  productId: string;
  skuid: string;
  skuName: string;
  price: number;
  quantity: number;
  totalPrice: number;
  images: string[];
}
interface Order {
  orderId: string;
  userId: string;
  shippingAddress: string;
  senderAddress: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  orderTime: Date;
  paymentTime: Date;
  shipmentTime: Date;
  deliveryTime: Date;
  remark: string;
  cancelReason: string;
  refundReason: string;
  createdAt: Date;
  updatedAt: Date;
}

// 订单项子文档
const orderItemSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
  },
  // 识别唯一的商品
  skuid:{
    type: String,
    required: true,
    unique: true,
  },
  skuName: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  images: {
    type: [String],
    default: [],
  },
}, { _id: true });

// 订单模型
const orderSchema = new mongoose.Schema(
  {
    // 识别订单
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // 用户信息  // 谁买的
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserInfo',
      required: true,
      index: true,
    },
    skuname:{
      type: String,
      required: true,
    },
    images:{
      type: String,
      default: '',
    },
    price:{
      type: Number,
      required: true,
    },
    amount:{
      type: Number,
      required: true,
    },
    totprice:{
      type: Number,
      required: true,
    },
    // 商户信息  // 谁卖的
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserInfo',
      required: true,
      index: true,
    },
    // 收货地址信息（快照，防止用户修改地址后订单地址改变）
    shippingAddress: {
      contactName: {
        type: String,
        required: true,
      },
      contactPhone: {
        type: String,
        required: true,
      },
      province: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      district: {
        type: String,
        required: true,
      },
      street: {
        type: String,
        default: '',
      },
      detailAddress: {
        type: String,
        required: true,
      },
      fullAddress: {
        type: String,
        required: true,
      },
    },
    // 发货地址
    senderAddress: {
      type: String,
      required: true,
    },
    useraddress:{
      type: String,
      required: true,
    },
    sendaddress:{
      type: String,
      required: true,
    },
    // 订单项 一个订单有多个商品
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items: any[]) => items.length > 0,
        message: '订单至少需要一个商品',
      },
    },
    // 订单金额
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    // 订单状态
    status: {
      type: String,
      enum: ['pending', 'paid', 'shipped', 'confirmed', 'delivered', 'cancelled', 'refunded'],
      default: 'pending',
      required: true,
      index: true,
    },
    sendtime:{
      type: Date,
    },
    arrivetime:{
      type: Date,
    },
    // 时间信息
    ordertime: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    paymentTime: {
      type: Date,
    },
    shipmentTime: {
      type: Date,
    },
    deliveryTime: {
      type: Date,
    },
    // 备注信息
    remark: {
      type: String,
      default: '',
    },
    // 取消原因
    cancelReason: {
      type: String,
    },
    // 退款原因
    refundReason: {
      type: String,
    },
    // 取件码
    pickupCode: {
      type: String,
      required: false,
      index: true, // 用于快速查询
    },
    // 取件码生成时间
    pickupCodeGeneratedAt: {
      type: Date,
      required: false,
    },
    // 取件码过期时间
    pickupCodeExpiresAt: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true, // 自动生成 createdAt 和 updatedAt
  }
);

// 索引优化
orderSchema.index({ userId: 1, orderTime: -1 });
orderSchema.index({ status: 1, orderTime: -1 });

//到处ordershcema
export { orderSchema };

const Order = mongoose.model('Order', orderSchema);
export default Order;
