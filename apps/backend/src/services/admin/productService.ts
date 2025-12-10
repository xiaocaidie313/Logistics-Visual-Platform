import Product from '../../models/product.js';
import mongoose from 'mongoose';

export class ProductService {
  // 创建商品
  async createProduct(productData: any): Promise<any> {
    if (!productData.merchantId) {
      throw new Error('必须指定商家ID');
    }
    const newProduct = new Product(productData);
    const savedProduct = await newProduct.save();
    return savedProduct;
  }

  // 更新商品
  async updateProduct(productId: string, productData: any): Promise<any> {
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      productData,
      { new: true, runValidators: true }
    );
    return updatedProduct;
  }

  // 删除商品
  async deleteProduct(productId: string): Promise<any> {
    const deletedProduct = await Product.findByIdAndDelete(productId);
    return deletedProduct;
  }

  // 获取单个商品
  async getProductById(productId: string): Promise<any> {
    const product = await Product.findById(productId);
    return product;
  }

  // 获取商品列表（支持分页、筛选、排序）
  async getProductList(queryParams: {
    page?: number;
    limit?: number;
    category?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    merchantId?: string;
  }): Promise<any> {
    const {
      page = 1,
      limit = 10,
      category,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      merchantId
    } = queryParams;

    // 构建查询条件
    const query: any = {};
    if (category) query.category = category;
    if (status) query.status = status;
    if (merchantId) {
      query.merchantId = new mongoose.Types.ObjectId(merchantId);
    }

    // 排序
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // 分页
    const pageNum = page;
    const limitNum = limit;
    const skip = (pageNum - 1) * limitNum;

    // 查询商品列表
    const products = await Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // 计算总数
    const total = await Product.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum);

    return {
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    };
  }

  // 按分类筛选商品
  async getProductsByCategory(category: string): Promise<any> {
    const products = await Product.find({ category }).sort({ createdAt: -1 });
    return products;
  }

  // 按状态筛选商品
  async getProductsByStatus(status: string): Promise<any> {
    const validStatuses = ['active', 'inactive', 'out_of_stock'];
    if (!validStatuses.includes(status)) {
      throw new Error('无效的商品状态');
    }
    const products = await Product.find({ status }).sort({ createdAt: -1 });
    return products;
  }

  // 更新商品状态
  async updateProductStatus(productId: string, status: string): Promise<any> {
    const validStatuses = ['active', 'inactive', 'out_of_stock'];
    if (!validStatuses.includes(status)) {
      throw new Error('无效的商品状态');
    }
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { status },
      { new: true }
    );
    return updatedProduct;
  }

  // 更新 SKU 库存
  async updateSkuStock(productId: string, skuId: string, stock: number): Promise<any> {
    if (typeof stock !== 'number' || stock < 0) {
      throw new Error('库存数量必须为非负数');
    }

    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('商品不存在');
    }

    const sku = product.skus.find((s: any) => s._id.toString() === skuId);
    if (!sku) {
      throw new Error('SKU 不存在');
    }

    sku.stock = stock;
    await product.save();

    return product;
  }

  // 商品搜索
  async searchProducts(keyword: string): Promise<any> {
    if (!keyword || typeof keyword !== 'string') {
      throw new Error('请提供搜索关键词');
    }

    const products = await Product.find({
      $or: [
        { productName: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ]
    }).sort({ salesCount: -1 });

    return products;
  }

  // 商品统计
  async getProductStatistics(merchantId?: string): Promise<any> {
    const matchStage: any = {};
    if (merchantId) {
      matchStage.merchantId = new mongoose.Types.ObjectId(merchantId);
    }

    const statistics = await Product.aggregate([
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalSales: { $sum: '$salesCount' }
        }
      }
    ]);

    const categoryStats = await Product.aggregate([
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    const countQuery = merchantId ? { merchantId } : {};
    const result = {
      total: await Product.countDocuments(countQuery),
      byStatus: statistics,
      byCategory: categoryStats
    };

    return result;
  }
}

export default new ProductService();

