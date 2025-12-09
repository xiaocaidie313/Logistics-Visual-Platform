// apps/frontend/src/services/trackService.ts
import axios from "../utils/request";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // api/admin

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
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// 根据订单ID获取物流追踪信息
export const getTrackByOrderId = async (orderId: string): Promise<ApiResponse<Track[]>> => {
  const response = await axios.get(`${API_BASE_URL}/track/order/${orderId}`);
  return response.data;
};

// 获取物流追踪列表
export const getTrackList = async (): Promise<ApiResponse<Track[]>> => {
  const response = await axios.get(`${API_BASE_URL}/track/list`);
  return response.data;
};

// 根据ID获取物流追踪信息
export const getTrackById = async (id: string): Promise<ApiResponse<Track>> => {
  const response = await axios.get(`${API_BASE_URL}/track/get/${id}`);
  return response.data;
};
