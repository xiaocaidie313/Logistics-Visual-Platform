import express from 'express';
import UserOrderController from '../../controllers/user/orderController.js';

const router = express.Router();

// 创建订单
router.post('/order', UserOrderController.createOrder.bind(UserOrderController));

// 更新订单
router.put('/order/update/:id', UserOrderController.updateOrder.bind(UserOrderController));

// 删除订单
router.delete('/order/delete/:id', UserOrderController.deleteOrder.bind(UserOrderController));

// 获取单个订单
router.get('/order/get/:id', UserOrderController.getOrder.bind(UserOrderController));

// 获取订单列表
router.get('/order/list', UserOrderController.getOrderList.bind(UserOrderController));

// 获取用户自己的订单
router.get('/order/my/:userId', UserOrderController.getMyOrders.bind(UserOrderController));

export default router;
