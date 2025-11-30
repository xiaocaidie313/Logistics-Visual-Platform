import express from 'express';
import type { Request, Response } from 'express';
import Product from '../../models/product.js';
import { sendResponse, auth } from '../../utils/index.js';
import mongoose from 'mongoose';

const router = express.Router();

// 创建商品
router.post('/product', auth, async (req: Request, res: Response) => {
  try {
    const productData = req.body;
    
    // 确保包含 merchantId
    if (!productData.merchantId) {
      sendResponse(res, 400, '必须指定商家ID', {});
      return;
    }

    const newProduct = new Product(productData);
    const savedProduct = await newProduct.save();
    sendResponse(res, 200, 'Success', savedProduct);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '创建商品失败';
    sendResponse(res, 400, errorMessage, {});
  }
});

// 更新商品
router.put('/product/update/:id', auth, async (req: Request, res: Response) => {
  try {
    const productData = req.body;
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id, 
      productData, 
      { new: true, runValidators: true }
    );
    
    if (!updatedProduct) {
      sendResponse(res, 404, '商品不存在', {});
      return;
    }
    
    sendResponse(res, 200, 'Success', updatedProduct);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '更新商品失败';
    sendResponse(res, 400, errorMessage, {});
  }
});

// 删除商品
router.delete('/product/delete/:id', auth, async (req: Request, res: Response) => {
  try {
    const productId = req.params.id;
    const deletedProduct = await Product.findByIdAndDelete(productId);
    
    if (!deletedProduct) {
      sendResponse(res, 404, '商品不存在', {});
      return;
    }
    
    sendResponse(res, 200, 'Success', deletedProduct);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '删除商品失败';
    sendResponse(res, 400, errorMessage, {});
  }
});

// 获取单个商品
router.get('/product/get/:id', auth, async (req: Request, res: Response) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    
    if (!product) {
      sendResponse(res, 404, '商品不存在', {});
      return;
    }
    
    sendResponse(res, 200, 'Success', product);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '获取商品失败';
    sendResponse(res, 400, errorMessage, {});
  }
});

// 获取商品列表（支持分页、筛选、排序）
router.get('/product/list', auth, async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      status, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      merchantId
    } = req.query;
    
    // 构建查询条件
    const query: any = {};
    if (category) query.category = category;
    if (status) query.status = status;
    if (merchantId) {
      query.merchantId = new mongoose.Types.ObjectId(merchantId as string);
    }
    
    // 排序
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;
    
    // 分页
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;
    
    // 查询商品列表
    const products = await Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum);
    
    // 计算总数
    const total = await Product.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum);
    
    // 返回符合前端期望的格式
    sendResponse(res, 200, 'Success', {
      products: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: total,
        totalPages: totalPages
      }
    });  
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '获取商品列表失败';
    sendResponse(res, 400, errorMessage, {});
  }
});

// 按分类筛选商品
router.get('/product/filter/category/:category', auth, async (req: Request, res: Response) => {
  try {
    const category = req.params.category;
    const products = await Product.find({ category }).sort({ createdAt: -1 });
    sendResponse(res, 200, 'Success', products);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '获取分类商品失败';
    sendResponse(res, 400, errorMessage, {});
  }
});

// 按状态筛选商品
router.get('/product/filter/status/:status', auth, async (req: Request, res: Response) => {
  try {
    const status = req.params.status;
    if (!status) {
      sendResponse(res, 400, '状态参数不能为空', {});
      return;
    }
    const validStatuses = ['active', 'inactive', 'out_of_stock'];
    
    if (!validStatuses.includes(status)) {
      sendResponse(res, 400, '无效的商品状态', {});
      return;
    }
    
    const products = await Product.find({ status }).sort({ createdAt: -1 });
    sendResponse(res, 200, 'Success', products);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '获取状态商品失败';
    sendResponse(res, 400, errorMessage, {});
  }
});

// 更新商品状态
router.put('/product/status/:id', auth, async (req: Request, res: Response) => {
  try {
    const productId = req.params.id;
    const { status } = req.body;
    
    const validStatuses = ['active', 'inactive', 'out_of_stock'];
    if (!validStatuses.includes(status)) {
      sendResponse(res, 400, '无效的商品状态', {});
      return;
    }
    
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { status },
      { new: true }
    );
    
    if (!updatedProduct) {
      sendResponse(res, 404, '商品不存在', {});
      return;
    }
    
    sendResponse(res, 200, 'Success', updatedProduct);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '更新商品状态失败';
    sendResponse(res, 400, errorMessage, {});
  }
});

// 更新 SKU 库存
router.put('/product/sku/stock/:id/:skuId', auth, async (req: Request, res: Response) => {
  try {
    const { id, skuId } = req.params;
    const { stock } = req.body;
    
    if (typeof stock !== 'number' || stock < 0) {
      sendResponse(res, 400, '库存数量必须为非负数', {});
      return;
    }
    
    const product = await Product.findById(id);
    
    if (!product) {
      sendResponse(res, 404, '商品不存在', {});
      return;
    }
    
    const sku = product.skus.find((s: any) => s._id.toString() === skuId);
    if (!sku) {
      sendResponse(res, 404, 'SKU 不存在', {});
      return;
    }
    
    sku.stock = stock;
    await product.save();
    
    sendResponse(res, 200, 'Success', product);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '更新库存失败';
    sendResponse(res, 400, errorMessage, {});
  }
});

// 商品搜索
router.get('/product/search', auth, async (req: Request, res: Response) => {
  try {
    const { keyword } = req.query;
    
    if (!keyword || typeof keyword !== 'string') {
      sendResponse(res, 400, '请提供搜索关键词', {});
      return;
    }
    
    const products = await Product.find({
      $or: [
        { productName: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ]
    }).sort({ salesCount: -1 });
    
    sendResponse(res, 200, 'Success', products);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '搜索商品失败';
    sendResponse(res, 400, errorMessage, {});
  }
});

// 商品统计
router.get('/product/statistics', auth, async (req: Request, res: Response) => {
  try {
    const statistics = await Product.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalSales: { $sum: '$salesCount' }
        }
      }
    ]);
    
    const categoryStats = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const result = {
      total: await Product.countDocuments(),
      byStatus: statistics,
      byCategory: categoryStats
    };
    
    sendResponse(res, 200, 'Success', result);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '获取商品统计失败';
    sendResponse(res, 400, errorMessage, {});
  }
});

export default router;
