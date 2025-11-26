import axios from 'axios';

const API_BASE_URL = 'http://localhost:3002/api/merchant';

// 地址接口
export interface Address {
  _id?: string;
  contactName: string;
  contactPhone: string;
  province: string;
  city: string;
  district: string;
  street?: string;
  detailAddress: string;
  addressTag?: 'home' | 'company' | 'other';
  isDefault: boolean;
}

// 用户接口
export interface User {
  _id?: string;
  username: string;
  phoneNumber: string;
  password?: string;  // 创建/更新时需要
  gender?: 'male' | 'female' | 'other';
  addresses: Address[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// 创建用户
export const createUser = async (userData: Omit<User, '_id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<User>> => {
  const response = await axios.post(`${API_BASE_URL}/userinfo`, userData);
  return response.data;
};

// 更新用户信息
export const updateUser = async (id: string, userData: Partial<User>): Promise<ApiResponse<User>> => {
  const response = await axios.put(`${API_BASE_URL}/userinfo/update/${id}`, userData);
  return response.data;
};

// 删除用户
export const deleteUser = async (id: string): Promise<ApiResponse<User>> => {
  const response = await axios.delete(`${API_BASE_URL}/userinfo/delete/${id}`);
  return response.data;
};

// 获取单个用户信息
export const getUser = async (id: string): Promise<ApiResponse<User>> => {
  const response = await axios.get(`${API_BASE_URL}/userinfo/get/${id}`);
  return response.data;
};

// 根据用户名获取用户信息
export const getUserByUsername = async (username: string): Promise<ApiResponse<User>> => {
  const response = await axios.get(`${API_BASE_URL}/userinfo/username/${username}`);
  return response.data;
};

// 获取用户列表
export const getUserList = async (): Promise<ApiResponse<User[]>> => {
  const response = await axios.get(`${API_BASE_URL}/userinfo/list`);
  return response.data;
};

// 添加用户地址
export const addUserAddress = async (userId: string, addressData: Address): Promise<ApiResponse<User>> => {
  const response = await axios.post(`${API_BASE_URL}/userinfo/${userId}/address`, addressData);
  return response.data;
};

// 删除用户地址
export const deleteUserAddress = async (userId: string, addressId: string): Promise<ApiResponse<User>> => {
  const response = await axios.delete(`${API_BASE_URL}/userinfo/${userId}/address/${addressId}`);
  return response.data;
};

// 设置默认地址
export const setDefaultAddress = async (userId: string, addressId: string): Promise<ApiResponse<User>> => {
  const response = await axios.put(`${API_BASE_URL}/userinfo/${userId}/address/${addressId}/default`);
  return response.data;
};
