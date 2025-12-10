import express from 'express';
import { auth } from '../../utils/index.js';
import OrderController from '../../controllers/admin/orderController.js';

const router = express.Router();

// 创建订单
router.post('/order', auth, OrderController.createOrder.bind(OrderController));

// 更新订单
router.put('/order/update/:id', auth, OrderController.updateOrder.bind(OrderController));

// 删除订单
router.delete('/order/delete/:id', auth, OrderController.deleteOrder.bind(OrderController));

// 获取单个订单
router.get('/order/get/:id', auth, OrderController.getOrder.bind(OrderController));

// 获取订单列表
router.get('/order/list', auth, OrderController.getOrderList.bind(OrderController));

// 切换订单状态
router.put('/order/switch/status/:id', auth, OrderController.updateOrderStatus.bind(OrderController));

// 按状态筛选订单（通用接口）
router.get('/order/filter/:status', auth, OrderController.getOrdersByStatus.bind(OrderController));

// 按订单时间排序
router.get('/order/sort/ordertime/:order', auth, OrderController.getOrdersSortedByTime.bind(OrderController));

// 按订单总金额排序
router.get('/order/sort/totalprice/:order', auth, OrderController.getOrdersSortedByPrice.bind(OrderController));

// 根据用户ID获取订单
router.get('/order/user/:userId', auth, OrderController.getOrdersByUserId.bind(OrderController));

// 根据商家ID获取订单
router.get('/order/merchant/:merchantId', auth, OrderController.getOrdersByMerchantId.bind(OrderController));

// 订单统计
router.get('/order/statistics', auth, OrderController.getOrderStatistics.bind(OrderController));

export default router;
