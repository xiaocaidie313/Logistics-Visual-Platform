import mongoose from 'mongoose';

// 商品 SKU 子文档
const skuSchema = new mongoose.Schema({
  skuid:{
    type: String,
    required: false
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
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  attributes: {
    color: String,
    size: String,
  },
}, { _id: true }); // 保留 _id，每个 SKU 都有唯一的 ObjectId

// 商品模型
const productSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    // SKU 列表
    skus: {
      type: [skuSchema],
      required: true,
      validate: {
        validator: (skus: any[]) => skus.length > 0,
        message: '商品至少需要一个 SKU',
      },
    },
    // 商品状态
    status: {
      type: String,
      enum: ['active', 'inactive', 'out_of_stock'],
      default: 'active',
    },
    // 销量
    salesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    images:{
      type: String,
      required: false,
      default: '',
    },
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserInfo',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// 索引优化
productSchema.index({ category: 1, status: 1 });
productSchema.index({ salesCount: -1 });
export { productSchema };
const Product = mongoose.model('Product', productSchema);
export default Product;
