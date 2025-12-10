import express from 'express';
import PickupController from '../../controllers/user/pickupController.js';
import { auth } from '../../utils/index.js';

const router = express.Router();

// 根据取件码查询物流信息（公开接口，不需要登录）
router.get('/track/:pickupCode', PickupController.getTrackByPickupCode.bind(PickupController));

// 根据取件码查询订单信息（需要登录）
router.get('/order/:pickupCode', auth, PickupController.getOrderByPickupCode.bind(PickupController));

// 验证取件码（用于自提柜等场景）
router.post('/verify', PickupController.verifyPickupCode.bind(PickupController));

export default router;

