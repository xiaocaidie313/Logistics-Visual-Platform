import express from 'express'
import { sendResponse } from '../../shared/sendresponse.js';
import type { Request, Response} from 'express'
import Order from '../../models/order.js'

const router = express.Router();

// 创建订单
router.post('/order', async (req: Request, res: Response) => {
  try {
    const orderData = req.body;
    const newOrder = new Order(orderData);
    const savedOrder = await newOrder.save();
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
    const orderId = req.params.id
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
    sendResponse(res, 400, errorMessage, {})
  }
});

// 获取用户自己的订单
router.get('/order/my/:userId', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const orders = await Order.find({ userId }).sort({ orderTime: -1 });
    sendResponse(res, 200, 'Success', orders);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '获取我的订单失败';
    sendResponse(res, 400, errorMessage, {});
  }
});

export default router;
