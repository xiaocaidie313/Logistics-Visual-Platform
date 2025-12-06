import type { Request, Response } from 'express';
import OrderService from '../../services/admin/orderService.js';
import { sendResponse } from '../../utils/index.js';

export class OrderController {
  // 创建订单
  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const orderData = req.body;
      const savedOrder = await OrderService.createOrder(orderData);
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
      if (!id) {
        sendResponse(res, 400, '订单ID不能为空', {});
        return;
      }
      const orderData = req.body;
      const updatedOrder = await OrderService.updateOrder(id, orderData);
      
      if (!updatedOrder) {
        sendResponse(res, 404, '订单不存在', {});
        return;
      }
      
      sendResponse(res, 200, 'Success', updatedOrder);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '更新订单失败';
      sendResponse(res, 400, errorMessage, {});
    }
  }

  // 删除订单
  async deleteOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        sendResponse(res, 400, '订单ID不能为空', {});
        return;
      }
      const deletedOrder = await OrderService.deleteOrder(id);
      
      if (!deletedOrder) {
        sendResponse(res, 404, '订单不存在', {});
        return;
      }
      
      sendResponse(res, 200, 'Success', deletedOrder);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '删除订单失败';
      sendResponse(res, 400, errorMessage, {});
    }
  }

  // 获取单个订单
  async getOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        sendResponse(res, 400, '订单ID不能为空', {});
        return;
      }
      const order = await OrderService.getOrderById(id);
      
      if (!order) {
        sendResponse(res, 404, '订单不存在', {});
        return;
      }
      
      sendResponse(res, 200, 'Success', order);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '获取订单失败';
      sendResponse(res, 400, errorMessage, {});
    }
  }

  // 获取订单列表
  async getOrderList(req: Request, res: Response): Promise<void> {
    try {
      const orders = await OrderService.getOrderList();
      sendResponse(res, 200, 'Success', orders);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '获取订单列表失败';
      sendResponse(res, 400, errorMessage, {});
    }
  }

  // 切换订单状态
  async updateOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        sendResponse(res, 400, '订单ID不能为空', {});
        return;
      }
      const { status, reason } = req.body;
      if (!status) {
        sendResponse(res, 400, '状态不能为空', {});
        return;
      }
      const updatedOrder = await OrderService.updateOrderStatus(id, status, reason);
      
      if (!updatedOrder) {
        sendResponse(res, 404, '订单不存在', {});
        return;
      }
      
      sendResponse(res, 200, 'Success', updatedOrder);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '切换订单状态失败';
      sendResponse(res, 400, errorMessage, {});
    }
  }

  // 按状态筛选订单
  async getOrdersByStatus(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.params;
      
      if (!status) {
        sendResponse(res, 400, '状态参数不能为空', {});
        return;
      }
      
      const validStatuses = ['pending', 'paid', 'shipped', 'confirmed', 'delivered', 'cancelled', 'refunded'];
      if (!validStatuses.includes(status)) {
        sendResponse(res, 400, '无效的订单状态', {});
        return;
      }
      
      const orders = await OrderService.getOrdersByStatus(status);
      sendResponse(res, 200, 'Success', orders);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : `获取${req.params.status}订单失败`;
      sendResponse(res, 400, errorMessage, {});
    }
  }

  // 按订单时间排序
  async getOrdersSortedByTime(req: Request, res: Response): Promise<void> {
    try {
      const { order } = req.params as { order: 'asc' | 'des' };
      const sortedOrders = await OrderService.getOrdersSortedByTime(order);
      sendResponse(res, 200, 'Success', sortedOrders);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '获取按订单时间排序的订单失败';
      sendResponse(res, 400, errorMessage, {});
    }
  }

  // 按订单总金额排序
  async getOrdersSortedByPrice(req: Request, res: Response): Promise<void> {
    try {
      const { order } = req.params as { order: 'asc' | 'des' };
      const sortedOrders = await OrderService.getOrdersSortedByPrice(order);
      sendResponse(res, 200, 'Success', sortedOrders);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '获取按订单金额排序的订单失败';
      sendResponse(res, 400, errorMessage, {});
    }
  }

  // 根据用户ID获取订单
  async getOrdersByUserId(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      if (!userId) {
        sendResponse(res, 400, '用户ID不能为空', {});
        return;
      }
      const orders = await OrderService.getOrdersByUserId(userId);
      sendResponse(res, 200, 'Success', orders);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '获取用户订单失败';
      sendResponse(res, 400, errorMessage, {});
    }
  }

  // 订单统计
  async getOrderStatistics(req: Request, res: Response): Promise<void> {
    try {
      const result = await OrderService.getOrderStatistics();
      sendResponse(res, 200, 'Success', result);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '获取订单统计失败';
      sendResponse(res, 400, errorMessage, {});
    }
  }
}

export default new OrderController();
