import axios from '../utils/request';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;// api/admin

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'confirmed' | 'delivered' | 'cancelled' | 'refunded';

// 订单项接口
export interface OrderItem {
  productId: string;
  skuid: string;
  skuName: string;
  price: number;
  quantity: number;
  totalPrice: number;
  images: string[];
}

// 收货地址接口
export interface ShippingAddress {
  contactName: string;
  contactPhone: string;
  province: string;
  city: string;
  district: string;
  street?: string;
  detailAddress: string;
  fullAddress: string;
}

export interface Order {
  _id?: string;
  id?: string;
  orderId: string;
  userId?: string;
  merchantId?: string;
  // 订单项数组（后端主要结构）
  items: OrderItem[];
  totalAmount: number;
  shippingAddress: ShippingAddress;
  senderAddress: string;
  status: OrderStatus;
  orderTime: Date | string;
  paymentTime?: Date | string;
  shipmentTime?: Date | string;
  deliveryTime?: Date | string;
  remark?: string;
  cancelReason?: string;
  refundReason?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  
  // 兼容旧字段（如果后端返回了扁平结构）
  skuname?: string;
  price?: number;
  amount?: number;
  totprice?: number;
  images?: string;
  arrivetime?: string;
  sendtime?: string;
  ordertime?: string;
  useraddress?: string;
  sendaddress?: string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// 创建订单
export const createOrder = async (orderData: Omit<Order, '_id'>): Promise<ApiResponse<Order>> => {
  const response = await axios.post(`${API_BASE_URL}/order`, orderData);
  return response.data;
};

// 更新订单
export const updateOrder = async (id: string, orderData: Partial<Order>): Promise<ApiResponse<Order>> => {
  const response = await axios.put(`${API_BASE_URL}/order/update/${id}`, orderData);
  return response.data;
};

// 删除订单
export const deleteOrder = async (id: string): Promise<ApiResponse<Order>> => {
  const response = await axios.delete(`${API_BASE_URL}/order/delete/${id}`);
  return response.data;
};

// 获取单个订单
export const getOrder = async (id: string): Promise<ApiResponse<Order>> => {
  const response = await axios.get(`${API_BASE_URL}/order/get/${id}`);
  return response.data;
};

// 获取订单列表
export const getOrderList = async (): Promise<ApiResponse<Order[]>> => {
  const response = await axios.get(`${API_BASE_URL}/order/list`);
  return response.data;
};

// 根据用户ID获取订单
export const getOrdersByUserId = async (userId: string): Promise<ApiResponse<Order[]>> => {
  const response = await axios.get(`${API_BASE_URL}/order/user/${userId}`);
  return response.data;
};

// 根据商家ID获取订单
export const getOrdersByMerchantId = async (merchantId: string): Promise<ApiResponse<Order[]>> => {
  const response = await axios.get(`${API_BASE_URL}/order/merchant/${merchantId}`);
  return response.data;
};

// 切换订单状态
export const updateOrderStatus = async (id: string, status: OrderStatus): Promise<ApiResponse<Order>> => {
  const response = await axios.put(`${API_BASE_URL}/order/switch/status/${id}`, { status });
  return response.data;
};

// 按状态筛选订单
export const getOrdersByStatus = async (status: OrderStatus): Promise<ApiResponse<Order[]>> => {
  const response = await axios.get(`${API_BASE_URL}/order/filter/${status}`);
  return response.data;
};

// 按时间排序
export const getOrdersSortByTime = async (order: 'asc' | 'des'): Promise<ApiResponse<Order[]>> => {
  const response = await axios.get(`${API_BASE_URL}/order/sort/ordertime/${order}`);
  return response.data;
};

// 按金额排序
export const getOrdersSortByPrice = async (order: 'asc' | 'des'): Promise<ApiResponse<Order[]>> => {
  const response = await axios.get(`${API_BASE_URL}/order/sort/totprice/${order}`);
  return response.data;
};

// 获取订单统计
export const getOrderStatistics = async (merchantId?: string): Promise<ApiResponse<{
  total: number;
  byStatus: Array<{
    _id: string;
    count: number;
    totalAmount: number;
  }>;
}>> => {
  const response = await axios.get(`${API_BASE_URL}/order/statistics`, {
    params: merchantId ? { merchantId } : {}
  });
  return response.data;
};

// 获取订单时间趋势统计
export const getOrderTrendStatistics = async (merchantId?: string, period: 'day' | 'week' | 'month' = 'day'): Promise<ApiResponse<Array<{
  _id: string;
  count: number;
  totalAmount: number;
}>>> => {
  const response = await axios.get(`${API_BASE_URL}/order/trend`, {
    params: {
      ...(merchantId ? { merchantId } : {}),
      period
    }
  });
  return response.data;
};

// 获取订单时段分析
export const getOrderHourStatistics = async (merchantId?: string): Promise<ApiResponse<Array<{
  _id: number;
  count: number;
  totalAmount: number;
}>>> => {
  const response = await axios.get(`${API_BASE_URL}/order/hour-statistics`, {
    params: merchantId ? { merchantId } : {}
  });
  return response.data;
};