import Order from "../../models/order.js";
import {
  emitOrderCreated,
  emitOrderUpdate,
  emitOrderStatusChange,
} from "../websocket.js";

export class UserOrderService {
  // 创建订单
  async createOrder(orderData: any): Promise<any> {
    // 如果订单数据中没有指定状态，默认设置为 paid（已支付）
    const isStatusNotSet = !orderData.status;
    if (isStatusNotSet) {
      orderData.status = 'paid';
      orderData.paymentTime = new Date();
    }
    
    const newOrder = new Order(orderData);
    const savedOrder = await newOrder.save();
    
    // 推送订单创建事件
    emitOrderCreated(savedOrder.orderId, savedOrder);
    
    // 如果状态被设置为 paid，推送状态变更事件
    if (isStatusNotSet && savedOrder.status === 'paid') {
      emitOrderStatusChange(savedOrder.orderId, 'paid', savedOrder);
    }
    
    return savedOrder;
  }

  // 更新订单（用户只能更新自己的订单）
  async updateOrder(orderId: string, userId: string, orderData: any): Promise<any> {
    // 先检查订单是否属于该用户
    const order = await Order.findById(orderId);
    if (!order) {
      return null;
    }
    if (order.userId?.toString() !== userId) {
      throw new Error('无权修改此订单');
    }

    const updatedOrder = await Order.findByIdAndUpdate(orderId, orderData, { new: true });
    if (updatedOrder) {
      emitOrderUpdate(updatedOrder.orderId, updatedOrder);
    }
    return updatedOrder;
  }

  // 删除订单（用户只能删除自己的订单）
  async deleteOrder(orderId: string, userId: string): Promise<any> {
    // 先检查订单是否属于该用户
    const order = await Order.findById(orderId);
    if (!order) {
      return null;
    }
    if (order.userId?.toString() !== userId) {
      throw new Error('无权删除此订单');
    }

    const deletedOrder = await Order.findByIdAndDelete(orderId);
    return deletedOrder;
  }

  // 获取单个订单（用户只能查看自己的订单）
  async getOrderById(orderId: string, userId: string): Promise<any> {
    const order = await Order.findById(orderId).populate('userId', 'username phoneNumber');
    if (!order) {
      return null;
    }
    if (order.userId?.toString() !== userId) {
      throw new Error('无权查看此订单');
    }
    return order;
  }

  // 获取用户自己的订单列表
  async getMyOrders(userId: string): Promise<any> {
    if (!userId) {
      throw new Error('用户ID不能为空');
    }
    const orders = await Order.find({ userId })
      .populate('userId', 'username phoneNumber')
      .sort({ orderTime: -1 });
    return orders;
  }
}

export default new UserOrderService();

