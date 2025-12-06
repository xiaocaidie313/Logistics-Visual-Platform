import Order from "../../models/order.js";
import {
  emitOrderCreated,
  emitOrderUpdate,
  emitOrderStatusChange,
} from "../websocket.js";

export class OrderService {
  // 创建订单
  async createOrder(orderData: any): Promise<any> {
    const newOrder = new Order(orderData);
    const savedOrder = await newOrder.save();
    emitOrderCreated(savedOrder.orderId, savedOrder);
    return savedOrder;
  }

  // 更新订单
  async updateOrder(orderId: string, orderData: any): Promise<any> {
    const updatedOrder = await Order.findByIdAndUpdate(orderId, orderData, { new: true });
    if (updatedOrder) {
      emitOrderUpdate(updatedOrder.orderId, updatedOrder);
    }
    return updatedOrder;
  }

  // 删除订单
  async deleteOrder(orderId: string): Promise<any> {
    const deletedOrder = await Order.findByIdAndDelete(orderId);
    return deletedOrder;
  }

  // 获取单个订单
  async getOrderById(orderId: string): Promise<any> {
    const order = await Order.findById(orderId).populate('userId', 'username phoneNumber');
    return order;
  }

  // 获取订单列表
  async getOrderList(): Promise<any> {
    const orders = await Order.find()
      .populate('userId', 'username phoneNumber')
      .sort({ orderTime: -1 });
    return orders;
  }

  // 更新订单状态
  async updateOrderStatus(orderId: string, status: string, reason?: string): Promise<any> {
    // 根据状态更新相应的时间字段
    const updateData: any = { status };
    
    switch (status) {
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
        updateData.cancelReason = reason || '';
        break;
      case 'refunded':
        updateData.refundReason = reason || '';
        break;
    }
    
    const updatedOrder = await Order.findByIdAndUpdate(orderId, updateData, { new: true });
    
    if (updatedOrder) {
      emitOrderStatusChange(updatedOrder.orderId, status, updatedOrder);
    }
    
    return updatedOrder;
  }

  // 按状态筛选订单
  async getOrdersByStatus(status: string): Promise<any> {
    const orders = await Order.find({ status })
      .populate('userId', 'username phoneNumber')
      .sort({ orderTime: -1 });
    return orders;
  }

  // 按订单时间排序
  async getOrdersSortedByTime(order: 'asc' | 'des'): Promise<any> {
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortedOrders = await Order.find()
      .populate('userId', 'username phoneNumber')
      .sort({ orderTime: sortOrder });
    return sortedOrders;
  }

  // 按订单总金额排序
  async getOrdersSortedByPrice(order: 'asc' | 'des'): Promise<any> {
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortedOrders = await Order.find()
      .populate('userId', 'username phoneNumber')
      .sort({ totalAmount: sortOrder });
    return sortedOrders;
  }

  // 根据用户ID获取订单
  async getOrdersByUserId(userId: string): Promise<any> {
    const orders = await Order.find({ userId })
      .populate('userId', 'username phoneNumber')
      .sort({ orderTime: -1 });
    return orders;
  }

  // 订单统计
  async getOrderStatistics(): Promise<any> {
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
    
    return result;
  }
}

export default new OrderService();
