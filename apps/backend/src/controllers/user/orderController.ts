import type { Request, Response } from 'express';
import UserOrderService from '../../services/user/orderService.js';
import { sendResponse } from '../../utils/index.js';

export class UserOrderController {
  // 创建订单
  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const orderData = req.body;
      const savedOrder = await UserOrderService.createOrder(orderData);
      sendResponse(res, 200, 'Success', savedOrder);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '创建订单失败';
      sendResponse(res, 400, errorMessage, {});
    }
  }

  // 更新订单
  async updateOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.body.userId || (req as any).user?.userId;
      
      if (!id) {
        sendResponse(res, 400, '订单ID不能为空', {});
        return;
      }
      if (!userId) {
        sendResponse(res, 400, '用户ID不能为空', {});
        return;
      }

      const orderData = req.body;
      const updatedOrder = await UserOrderService.updateOrder(id, userId, orderData);
      
      if (!updatedOrder) {
        sendResponse(res, 404, '订单不存在', {});
        return;
      }
      
      sendResponse(res, 200, 'Success', updatedOrder);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '更新订单失败';
      if (errorMessage.includes('无权')) {
        sendResponse(res, 403, errorMessage, {});
        return;
      }
      sendResponse(res, 400, errorMessage, {});
    }
  }

  // 删除订单
  async deleteOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.body.userId || (req as any).user?.userId;
      
      if (!id) {
        sendResponse(res, 400, '订单ID不能为空', {});
        return;
      }
      if (!userId) {
        sendResponse(res, 400, '用户ID不能为空', {});
        return;
      }

      const deletedOrder = await UserOrderService.deleteOrder(id, userId);
      
      if (!deletedOrder) {
        sendResponse(res, 404, '订单不存在', {});
        return;
      }
      
      sendResponse(res, 200, 'Success', deletedOrder);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '删除订单失败';
      if (errorMessage.includes('无权')) {
        sendResponse(res, 403, errorMessage, {});
        return;
      }
      sendResponse(res, 400, errorMessage, {});
    }
  }

  // 获取单个订单
  async getOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.query.userId as string || (req as any).user?.userId;
      
      if (!id) {
        sendResponse(res, 400, '订单ID不能为空', {});
        return;
      }
      if (!userId) {
        sendResponse(res, 400, '用户ID不能为空', {});
        return;
      }

      const order = await UserOrderService.getOrderById(id, userId);
      
      if (!order) {
        sendResponse(res, 404, '订单不存在', {});
        return;
      }
      
      sendResponse(res, 200, 'Success', order);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '获取订单失败';
      if (errorMessage.includes('无权')) {
        sendResponse(res, 403, errorMessage, {});
        return;
      }
      sendResponse(res, 400, errorMessage, {});
    }
  }

  // 获取订单列表（已废弃，使用 getMyOrders）
  async getOrderList(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.query.userId as string || (req as any).user?.userId;
      if (!userId) {
        sendResponse(res, 400, '用户ID不能为空', {});
        return;
      }
      const orders = await UserOrderService.getMyOrders(userId);
      sendResponse(res, 200, 'Success', orders);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '获取订单列表失败';
      sendResponse(res, 400, errorMessage, {});
    }
  }

  // 获取用户自己的订单
  async getMyOrders(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        sendResponse(res, 400, '用户ID不能为空', {});
        return;
      }

      const orders = await UserOrderService.getMyOrders(userId);
      sendResponse(res, 200, 'Success', orders);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '获取我的订单失败';
      sendResponse(res, 400, errorMessage, {});
    }
  }
}

export default new UserOrderController();

