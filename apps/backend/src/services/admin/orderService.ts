import mongoose from 'mongoose';
import Order from "../../models/order.js";
import {
  emitOrderCreated,
  emitOrderUpdate,
  emitOrderStatusChange,
} from "../websocket.js";

export class OrderService {
  // 创建订单
  async createOrder(orderData: any): Promise<any> {
    // 如果没有指定状态，默认设置为 paid（已支付）
    if (!orderData.status) {
      orderData.status = 'paid';
    }
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

  // 根据商家ID获取订单
  async getOrdersByMerchantId(merchantId: string): Promise<any> {
    const orders = await Order.find({ merchantId })
      .populate('userId', 'username phoneNumber')
      .populate('merchantId', 'username phoneNumber')
      .sort({ orderTime: -1 });
    return orders;
  }

  // 订单统计
  async getOrderStatistics(merchantId?: string): Promise<any> {
    const matchStage: any = {};
    if (merchantId) {
      matchStage.merchantId = new mongoose.Types.ObjectId(merchantId);
    }

    const statistics = await Order.aggregate([
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { 
            $sum: {
              $ifNull: ['$totalAmount', { $ifNull: ['$totprice', 0] }]
            }
          },
        },
      },
    ]);
    
    const countQuery = merchantId ? { merchantId } : {};
    const result = {
      total: await Order.countDocuments(countQuery),
      byStatus: statistics,
    };
    
    return result;
  }

  // 订单时间趋势统计（按日/周/月）
  async getOrderTrendStatistics(merchantId?: string, period: 'day' | 'week' | 'month' = 'day'): Promise<any> {
    const matchStage: any = {
      ordertime: { $exists: true, $ne: null }
    };
    if (merchantId) {
      matchStage.merchantId = new mongoose.Types.ObjectId(merchantId);
    }

    // 根据周期确定日期格式
    let dateFormatStr: string;
    switch (period) {
      case 'day':
        dateFormatStr = '%Y-%m-%d';
        break;
      case 'week':
        dateFormatStr = '%Y-W%V';
        break;
      case 'month':
        dateFormatStr = '%Y-%m';
        break;
      default:
        dateFormatStr = '%Y-%m-%d';
    }

    const trendStats = await Order.aggregate([
      { $match: matchStage },
      {
        $addFields: {
          ordertimeDate: { $toDate: '$ordertime' }
        }
      },
      {
        $match: {
          ordertimeDate: { $ne: null }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { 
              format: dateFormatStr,
              date: '$ordertimeDate'
            }
          },
          count: { $sum: 1 },
          totalAmount: { 
            $sum: {
              $ifNull: ['$totalAmount', { $ifNull: ['$totprice', 0] }]
            }
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    return trendStats;
  }

  // 订单时段分析（按小时统计）
  async getOrderHourStatistics(merchantId?: string): Promise<any> {
    const matchStage: any = {
      ordertime: { $exists: true, $ne: null }
    };
    if (merchantId) {
      matchStage.merchantId = new mongoose.Types.ObjectId(merchantId);
    }

    const hourStats = await Order.aggregate([
      { $match: matchStage },
      {
        $addFields: {
          ordertimeDate: { $toDate: '$ordertime' }
        }
      },
      {
        $match: {
          ordertimeDate: { $ne: null }
        }
      },
      {
        $group: {
          _id: { $hour: '$ordertimeDate' },
          count: { $sum: 1 },
          totalAmount: { 
            $sum: {
              $ifNull: ['$totalAmount', { $ifNull: ['$totprice', 0] }]
            }
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    return hourStats;
  }
}

export default new OrderService();
