import axios from '../utils/request';

// 确保 API_BASE_URL 不包含 /admin，避免路径重复
const getApiBaseUrl = () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api';
  // 如果环境变量已经包含了 /admin，去掉它
  return baseUrl.replace(/\/admin$/, '');
};

const API_BASE_URL = getApiBaseUrl();

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
  role?: 'admin' | 'merchant' | 'customer';
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
  const response = await axios.post(`${API_BASE_URL}/admin/userInfo`, userData);
  return response.data;
};

// 更新用户信息
export const updateUser = async (id: string, userData: Partial<User>): Promise<ApiResponse<User>> => {
  const response = await axios.put(`${API_BASE_URL}/admin/userInfo/update/${id}`, userData);
  return response.data;
};

// 删除用户
export const deleteUser = async (id: string): Promise<ApiResponse<User>> => {
  const response = await axios.delete(`${API_BASE_URL}/admin/userInfo/delete/${id}`);
  return response.data;
};

// 获取单个用户信息
export const getUser = async (id: string): Promise<ApiResponse<User>> => {
  const response = await axios.get(`${API_BASE_URL}/admin/userInfo/get/${id}`);
  return response.data;
};

// 根据用户名获取用户信息
export const getUserByUsername = async (username: string): Promise<ApiResponse<User>> => {
  const response = await axios.get(`${API_BASE_URL}/admin/userInfo/username/${username}`);
  return response.data;
};

// 获取用户列表
export const getUserList = async (): Promise<ApiResponse<User[]>> => {
  const response = await axios.get(`${API_BASE_URL}/admin/userInfo/list`);
  return response.data;
};

// 添加用户地址
export const addUserAddress = async (userId: string, addressData: Address): Promise<ApiResponse<User>> => {
  const response = await axios.post(`${API_BASE_URL}/admin/userInfo/${userId}/address`, addressData);
  return response.data;
};

// 删除用户地址
export const deleteUserAddress = async (userId: string, addressId: string): Promise<ApiResponse<User>> => {
  const response = await axios.delete(`${API_BASE_URL}/admin/userInfo/${userId}/address/${addressId}`);
  return response.data;
};

// 设置默认地址
export const setDefaultAddress = async (userId: string, addressId: string): Promise<ApiResponse<User>> => {
  const response = await axios.put(`${API_BASE_URL}/admin/userInfo/${userId}/address/${addressId}/default`);
  return response.data;
};

// 更新用户地址（通过先删除再添加的方式实现）
export const updateUserAddress = async (userId: string, addressId: string, addressData: Address): Promise<ApiResponse<User>> => {
  // 先删除旧地址
  await deleteUserAddress(userId, addressId);
  // 再添加新地址
  return await addUserAddress(userId, addressData);
};