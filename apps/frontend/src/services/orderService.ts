import axios from 'axios';
// 配置axios拦截器 加入token
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if(token){
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
},error => Promise.reject(error))

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;// api/admin

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'confirmed' | 'delivered' | 'cancelled' | 'refunded';

export interface Order {
  _id?: string;
  id: string;
  skuname: string;
  orderId: string;
  price: number;
  amount: number;
  totprice: number;
  images: string;
  arrivetime: string;
  sendtime: string;
  ordertime: string;
  useraddress: string;
  sendaddress: string;
  status: OrderStatus;
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
