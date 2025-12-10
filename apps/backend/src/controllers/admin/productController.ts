import type { Request, Response } from 'express';
import ProductService from '../../services/admin/productService.js';
import { sendResponse } from '../../utils/index.js';

export class ProductController {
  // 创建商品
  async createProduct(req: Request, res: Response): Promise<void> {
    try {
      const productData = req.body;
      const savedProduct = await ProductService.createProduct(productData);
      sendResponse(res, 200, 'Success', savedProduct);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '创建商品失败';
      sendResponse(res, 400, errorMessage, {});
    }
  }

  // 更新商品
  async updateProduct(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        sendResponse(res, 400, '商品ID不能为空', {});
        return;
      }
      const productData = req.body;
      const updatedProduct = await ProductService.updateProduct(id, productData);

      if (!updatedProduct) {
        sendResponse(res, 404, '商品不存在', {});
        return;
      }

      sendResponse(res, 200, 'Success', updatedProduct);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '更新商品失败';
      sendResponse(res, 400, errorMessage, {});
    }
  }

  // 删除商品
  async deleteProduct(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        sendResponse(res, 400, '商品ID不能为空', {});
        return;
      }
      const deletedProduct = await ProductService.deleteProduct(id);

      if (!deletedProduct) {
        sendResponse(res, 404, '商品不存在', {});
        return;
      }

      sendResponse(res, 200, 'Success', deletedProduct);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '删除商品失败';
      sendResponse(res, 400, errorMessage, {});
    }
  }

  // 获取单个商品
  async getProduct(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        sendResponse(res, 400, '商品ID不能为空', {});
        return;
      }
      const product = await ProductService.getProductById(id);

      if (!product) {
        sendResponse(res, 404, '商品不存在', {});
        return;
      }

      sendResponse(res, 200, 'Success', product);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '获取商品失败';
      sendResponse(res, 400, errorMessage, {});
    }
  }

  // 获取商品列表
  async getProductList(req: Request, res: Response): Promise<void> {
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

      const result = await ProductService.getProductList({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        category: category as string,
        status: status as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        merchantId: merchantId as string
      });

      sendResponse(res, 200, 'Success', result);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '获取商品列表失败';
      sendResponse(res, 400, errorMessage, {});
    }
  }

  // 按分类筛选商品
  async getProductsByCategory(req: Request, res: Response): Promise<void> {
    try {
      const { category } = req.params;
      if (!category) {
        sendResponse(res, 400, '分类参数不能为空', {});
        return;
      }
      const products = await ProductService.getProductsByCategory(category);
      sendResponse(res, 200, 'Success', products);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '获取分类商品失败';
      sendResponse(res, 400, errorMessage, {});
    }
  }

  // 按状态筛选商品
  async getProductsByStatus(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.params;
      if (!status) {
        sendResponse(res, 400, '状态参数不能为空', {});
        return;
      }
      const products = await ProductService.getProductsByStatus(status);
      sendResponse(res, 200, 'Success', products);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '获取状态商品失败';
      sendResponse(res, 400, errorMessage, {});
    }
  }

  // 更新商品状态
  async updateProductStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        sendResponse(res, 400, '商品ID不能为空', {});
        return;
      }
      const { status } = req.body;
      if (!status) {
        sendResponse(res, 400, '状态不能为空', {});
        return;
      }
      const updatedProduct = await ProductService.updateProductStatus(id, status);

      if (!updatedProduct) {
        sendResponse(res, 404, '商品不存在', {});
        return;
      }

      sendResponse(res, 200, 'Success', updatedProduct);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '更新商品状态失败';
      sendResponse(res, 400, errorMessage, {});
    }
  }

  // 更新 SKU 库存
  async updateSkuStock(req: Request, res: Response): Promise<void> {
    try {
      const { id, skuId } = req.params;
      if (!id || !skuId) {
        sendResponse(res, 400, '商品ID或SKU ID不能为空', {});
        return;
      }
      const { stock } = req.body;
      const product = await ProductService.updateSkuStock(id, skuId, stock);
      sendResponse(res, 200, 'Success', product);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '更新库存失败';
      sendResponse(res, 400, errorMessage, {});
    }
  }

  // 商品搜索
  async searchProducts(req: Request, res: Response): Promise<void> {
    try {
      const { keyword } = req.query;
      if (!keyword || typeof keyword !== 'string') {
        sendResponse(res, 400, '请提供搜索关键词', {});
        return;
      }
      const products = await ProductService.searchProducts(keyword);
      sendResponse(res, 200, 'Success', products);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '搜索商品失败';
      sendResponse(res, 400, errorMessage, {});
    }
  }

  // 商品统计
  async getProductStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { merchantId } = req.query;
      const result = await ProductService.getProductStatistics(merchantId as string);
      sendResponse(res, 200, 'Success', result);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '获取商品统计失败';
      sendResponse(res, 400, errorMessage, {});
    }
  }
}

export default new ProductController();

