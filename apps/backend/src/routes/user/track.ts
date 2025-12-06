import express from 'express';
import UserTrackController from '../../controllers/user/trackController.js';

const router = express.Router();

// 根据id查询
router.get('/track/:id', UserTrackController.getTrackById.bind(UserTrackController));

// 根据订单id查询
router.get('/track/order/:orderId', UserTrackController.getTracksByOrderId.bind(UserTrackController));

// 根据物流单号查询
router.get('/track/logistics/:logisticsNumber', UserTrackController.getTrackByLogisticsNumber.bind(UserTrackController));

export default router;
