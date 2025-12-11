import express from 'express';
import { auth } from '../../utils/index.js';
import ProductController from '../../controllers/admin/productController.js';

const router = express.Router();

// 创建商品
router.post('/product', auth, ProductController.createProduct.bind(ProductController));

// 更新商品
router.put('/product/update/:id', auth, ProductController.updateProduct.bind(ProductController));

// 删除商品
router.delete('/product/delete/:id', auth, ProductController.deleteProduct.bind(ProductController));

// 获取单个商品
router.get('/product/get/:id', auth, ProductController.getProduct.bind(ProductController));

// 获取商品列表（支持分页、筛选、排序）
router.get('/product/list', auth, ProductController.getProductList.bind(ProductController));

// 按分类筛选商品
router.get('/product/filter/category/:category', auth, ProductController.getProductsByCategory.bind(ProductController));

// 按状态筛选商品
router.get('/product/filter/status/:status', auth, ProductController.getProductsByStatus.bind(ProductController));

// 更新商品状态
router.put('/product/status/:id', auth, ProductController.updateProductStatus.bind(ProductController));

// 更新 SKU 库存
router.put('/product/sku/stock/:id/:skuId', auth, ProductController.updateSkuStock.bind(ProductController));

// 商品搜索
router.get('/product/search', auth, ProductController.searchProducts.bind(ProductController));

// 商品统计
router.get('/product/statistics', auth, ProductController.getProductStatistics.bind(ProductController));

// 商品销售排行
router.get('/product/sales-ranking', auth, ProductController.getProductSalesRanking.bind(ProductController));

export default router;
