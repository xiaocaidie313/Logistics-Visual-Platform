import express from 'express';
import type { Request, Response } from 'express';
import Order from '../../models/order.js';
import { sendResponse } from '../../utils/index.js';
import { emitOrderCreated, emitOrderUpdate, emitOrderStatusChange } from '../../services/websocket.js';

const router = express.Router();

// 创建订单
router.post('/order', async (req: Request, res: Response) => {
  try {
    const orderData = req.body;
    const newOrder = new Order(orderData);
    const savedOrder = await newOrder.save();
    
    // 推送 WebSocket 事件
    emitOrderCreated(savedOrder.orderId, savedOrder);
    
    sendResponse(res, 200, 'Success', savedOrder);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '创建订单失败';
    sendResponse(res, 400, errorMessage, {});
  }
});

// 更新订单
router.put('/order/update/:id', async (req: Request, res: Response) => {
  try {
    const newOrder = req.body;
    const updatedOrder = await Order.findByIdAndUpdate(req.params.id, newOrder, { new: true });
    
    if (updatedOrder) {
      // 推送 WebSocket 事件
      emitOrderUpdate(updatedOrder.orderId, updatedOrder);
    }
    
    sendResponse(res, 200, 'Success', updatedOrder);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '更新订单失败';
    sendResponse(res, 400, errorMessage, {});
  }
});

// 删除订单
router.delete('/order/delete/:id', async (req: Request, res: Response) => {
  try {
    const orderId = req.params.id;
    const deletedOrder = await Order.findByIdAndDelete(orderId);
    sendResponse(res, 200, 'Success', deletedOrder);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '删除订单失败';
    sendResponse(res, 400, errorMessage, {});
  }
});

// 获取单个订单
router.get('/order/get/:id', async (req: Request, res: Response) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId).populate('userId', 'username phoneNumber');
    sendResponse(res, 200, 'Success', order);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '获取订单失败';
    sendResponse(res, 400, errorMessage, {});
  }
});

// 获取订单列表
router.get('/order/list', async (req: Request, res: Response) => {
  try {
    const orders = await Order.find().populate('userId', 'username phoneNumber').sort({ orderTime: -1 });
    sendResponse(res, 200, 'Success', orders);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '获取订单列表失败';
    sendResponse(res, 400, errorMessage, {});
  }
});

// 切换订单状态
router.put('/order/switch/status/:id', async (req: Request, res: Response) => {
  try {
    const orderId = req.params.id;
    const newStatus = req.body.status;
    
    // 根据状态更新相应的时间字段
    const updateData: any = { status: newStatus };
    
    switch (newStatus) {
      case 'paid':
        updateData.paymentTime = new Date();
        break;
      case 'shipped':
        updateData.shipmentTime = new Date();
        break;
      case 'delivered':
        updateData.deliveryTime = new Date();
        break;
      case 'cancelled':
        updateData.cancelReason = req.body.reason || '';
        break;
      case 'refunded':
        updateData.refundReason = req.body.reason || '';
        break;
    }
    
    const updatedOrder = await Order.findByIdAndUpdate(orderId, updateData, { new: true });
    
    if (updatedOrder) {
      // 推送 WebSocket 事件
      emitOrderStatusChange(updatedOrder.orderId, newStatus, updatedOrder);
    }
    
    sendResponse(res, 200, 'Success', updatedOrder);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '切换订单状态失败';
    sendResponse(res, 400, errorMessage, {});
  }
});

// 按状态筛选订单（通用接口）
router.get('/order/filter/:status', async (req: Request, res: Response) => {
  try {
    const status = req.params.status;
    if (!status) {
      sendResponse(res, 400, '状态参数不能为空', {});
      return;
    }
    const validStatuses = ['pending', 'paid', 'shipped', 'confirmed', 'delivered', 'cancelled', 'refunded'];
    
    if (!validStatuses.includes(status)) {
      sendResponse(res, 400, '无效的订单状态', {});
      return;
    }
    
    const orders = await Order.find({ status })
      .populate('userId', 'username phoneNumber')
      .sort({ orderTime: -1 });
    sendResponse(res, 200, 'Success', orders);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : `获取${req.params.status}订单失败`;
    sendResponse(res, 400, errorMessage, {});
  }
});

// 按订单时间排序
router.get('/order/sort/ordertime/:order', async (req: Request, res: Response) => {
  try {
    const sortOrder = req.params.order === 'asc' ? 1 : -1;
    const sortedOrders = await Order.find()
      .populate('userId', 'username phoneNumber')
      .sort({ orderTime: sortOrder });
    sendResponse(res, 200, 'Success', sortedOrders);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '获取按订单时间排序的订单失败';
    sendResponse(res, 400, errorMessage, {});
  }
});

// 按订单总金额排序
router.get('/order/sort/totalprice/:order', async (req: Request, res: Response) => {
  try {
    const sortOrder = req.params.order === 'asc' ? 1 : -1;
    const sortedOrders = await Order.find()
      .populate('userId', 'username phoneNumber')
      .sort({ totalAmount: sortOrder });
    sendResponse(res, 200, 'Success', sortedOrders);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '获取按订单金额排序的订单失败';
    sendResponse(res, 400, errorMessage, {});
  }
});

// 根据用户ID获取订单
router.get('/order/user/:userId', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const orders = await Order.find({ userId })
      .populate('userId', 'username phoneNumber')
      .sort({ orderTime: -1 });
    sendResponse(res, 200, 'Success', orders);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '获取用户订单失败';
    sendResponse(res, 400, errorMessage, {});
  }
});

// 订单统计
router.get('/order/statistics', async (req: Request, res: Response) => {
  try {
    const statistics = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
        },
      },
    ]);
    
    const result = {
      total: await Order.countDocuments(),
      byStatus: statistics,
    };
    
    sendResponse(res, 200, 'Success', result);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '获取订单统计失败';
    sendResponse(res, 400, errorMessage, {});
  }
});

export default router;
