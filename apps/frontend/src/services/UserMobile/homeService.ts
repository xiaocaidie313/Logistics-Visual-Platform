import axios from '../../utils/request';
import { ApiResponse, Order } from '../orderService';
const API_BASE_URL = 'http://localhost:3002/api';

// 首页推荐商品
export const getHomeData = async (page=1, limit=10) => {
    const response = await axios.get(`${API_BASE_URL}/admin/product/list`,
        {params:{page, limit}});
    return response.data;
}

// 购买商品 等效实现 创建订单

// 创建订单
export const createOrder = async (orderData: Omit<Order, '_id'>): Promise<ApiResponse<Order>> => {
    const response = await axios.post(`${API_BASE_URL}/user/order`, orderData);
    return response.data;
  };