import express from 'express';
import { auth } from '../../utils/index.js';
import MerchantController from '../../controllers/admin/merchantController.js';

const router = express.Router();

// 创建商家
router.post('/merchant', auth, MerchantController.createMerchant.bind(MerchantController));

// 获取商家列表
router.get('/merchant/list', auth, MerchantController.getMerchantList.bind(MerchantController));

// 获取商家详情
router.get('/merchant/:id', auth, MerchantController.getMerchant.bind(MerchantController));

// 更新商家信息
router.put('/merchant/:id', auth, MerchantController.updateMerchant.bind(MerchantController));

// 更新商家配送范围
router.put('/merchant/:id/delivery-range', auth, MerchantController.updateDeliveryRange.bind(MerchantController));

// 更新商家状态
router.put('/merchant/:id/status', auth, MerchantController.updateMerchantStatus.bind(MerchantController));

// 删除商家
router.delete('/merchant/:id', auth, MerchantController.deleteMerchant.bind(MerchantController));

export default router;
