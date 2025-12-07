import axios from '../../utils/request';
const API_BASE_URL = 'http://localhost:3002/api';

// 首页推荐商品
export const getHomeData = async () => {
    const response = await axios.get(`${API_BASE_URL}/admin/product/list`);
    return response.data;
}