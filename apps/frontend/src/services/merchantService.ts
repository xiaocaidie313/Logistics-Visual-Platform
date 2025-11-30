import axios from 'axios';
// 配置axios拦截器 加入token
axios.interceptors.request.use(config => {
    const token = localStorage.getItem('token')
    if(token){
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },error => Promise.reject(error))

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';

// 商家类型定义
export interface ExpressAreaRange {
    province: string;
    city: string;
    district: string;
}

export interface InstantAreaRange {
    cityName: string;
    cityCode: string;
    center: {
        lng: number;
        lat: number;
    };
    radius?: number;
    polygon?: Array<{
        lng: number;
        lat: number;
    }>;
}

export interface DeliveryMethods {
    express: {
        enabled: boolean;
        coverageAreas: ExpressAreaRange[];
    };
    instant: {
        enabled: boolean;
        coverageAreas: InstantAreaRange[];
    };
}

export interface Merchant {
    _id?: string;
    merchantName: string;
    merchantCode: string;
    contactPerson: string;
    contactPhone: string;
    email?: string;
    address?: {
        province: string;
        city: string;
        district: string;
        detailAddress: string;
        longitude?: number;
        latitude?: number;
    };
    status: 'active' | 'inactive' | 'suspended';
    userId?: string;
    deliveryMethods: DeliveryMethods;
    businessHours?: {
        start: string;
        end: string;
    };
    description?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface MerchantListParams {
    page?: number;
    pageSize?: number;
    status?: string;
    keyword?: string;
}

export interface MerchantListResponse {
    merchants: Merchant[];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
}

// 获取商家列表
export const getMerchantList = async (params: MerchantListParams = {}) => {
    const response = await axios.get<{
        code: number;
        message: string;
        data: MerchantListResponse;
    }>(`${API_BASE_URL}/merchant/list`, { params });
    return response.data;
};

// 获取商家详情
export const getMerchantDetail = async (id: string) => {
    const response = await axios.get<{
        code: number;
        message: string;
        data: Merchant;
    }>(`${API_BASE_URL}/merchant/${id}`);
    return response.data;
};

// 创建商家
export const createMerchant = async (merchantData: Partial<Merchant>) => {
    const response = await axios.post<{
        code: number;
        message: string;
        data: Merchant;
    }>(`${API_BASE_URL}/merchant`, merchantData);
    return response.data;
};

// 更新商家信息
export const updateMerchant = async (id: string, merchantData: Partial<Merchant>) => {
    const response = await axios.put<{
        code: number;
        message: string;
        data: Merchant;
    }>(`${API_BASE_URL}/merchant/${id}`, merchantData);
    return response.data;
};

// 更新商家配送范围
export const updateMerchantDeliveryRange = async (id: string, deliveryMethods: DeliveryMethods) => {
    const response = await axios.put<{
        code: number;
        message: string;
        data: Merchant;
    }>(`${API_BASE_URL}/merchant/${id}/delivery-range`, { deliveryMethods });
    return response.data;
};

// 更新商家状态
export const updateMerchantStatus = async (id: string, status: 'active' | 'inactive' | 'suspended') => {
    const response = await axios.put<{
        code: number;
        message: string;
        data: Merchant;
    }>(`${API_BASE_URL}/merchant/${id}/status`, { status });
    return response.data;
};

// 删除商家
export const deleteMerchant = async (id: string) => {
    const response = await axios.delete<{
        code: number;
        message: string;
        data: any;
    }>(`${API_BASE_URL}/merchant/${id}`);
    return response.data;
};
