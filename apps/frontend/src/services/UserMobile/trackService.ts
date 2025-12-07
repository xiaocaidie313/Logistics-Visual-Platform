// apps/frontend/src/services/UserMobile/trackService.ts
import axios from "../../utils/request";
const API_BASE_URL = 'http://localhost:3002/api/user';

export interface TrackNode {
  time: Date | string;
  location: string;
  description: string;
  status: string;
}

export interface Track {
  _id?: string;
  id: string;
  orderId: string;
  logisticsCompany: string;
  logisticsNumber: string;
  logisticsStatus: string;
  sendAddress: string;
  userAddress: string;
  // 地图可视化字段
  path?: number[][];
  currentCoords?: number[];
  startCoords?: number[];
  endCoords?: number[];
  // 物流轨迹数组
  tracks?: TrackNode[];
  // ... 其他字段
}

// 根据订单ID获取物流追踪信息
export const getTrackByOrderId = async (orderId: string) => {
  const response = await axios.get(`${API_BASE_URL}/track/order/${orderId}`);
  return response.data;
};