import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface ProductSKU {
  _id?: string;
  skuName: string;
  price: number;
  stock: number;
  attributes?: {
    color?: string;
    size?: string;
  };
}

export interface Product {
  _id?: string;
  productName: string;
  category: string;
  description?: string;
  skus: ProductSKU[];
  status: 'active' | 'inactive' | 'out_of_stock';
  salesCount?: number;
  merchantId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductListResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 创建商品
export const createProduct = async (productData: Partial<Product>) => {
  const response = await axios.post(`${API_BASE_URL}/product`, productData);
  return response.data;
};

// 更新商品
export const updateProduct = async (id: string, productData: Partial<Product>) => {
  const response = await axios.put(`${API_BASE_URL}/product/update/${id}`, productData);
  return response.data;
};

// 删除商品
export const deleteProduct = async (id: string) => {
  const response = await axios.delete(`${API_BASE_URL}/product/delete/${id}`);
  return response.data;
};

// 获取单个商品（通过 _id）
export const getProduct = async (id: string) => {
  const response = await axios.get(`${API_BASE_URL}/product/get/${id}`);
  return response.data;
};

// 获取商品列表
export const getProductList = async (params?: {
  page?: number;
  limit?: number;
  category?: string;
  status?: string;
  merchantId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) => {
  const response = await axios.get(`${API_BASE_URL}/product/list`, { params });
  return response.data;
};

// 按分类筛选商品
export const getProductsByCategory = async (category: string) => {
  const response = await axios.get(`${API_BASE_URL}/product/filter/category/${category}`);
  return response.data;
};

// 按状态筛选商品
export const getProductsByStatus = async (status: string) => {
  const response = await axios.get(`${API_BASE_URL}/product/filter/status/${status}`);
  return response.data;
};

// 更新商品状态
export const updateProductStatus = async (id: string, status: string) => {
  const response = await axios.put(`${API_BASE_URL}/product/status/${id}`, { status });
  return response.data;
};

// 更新 SKU 库存
export const updateSKUStock = async (productId: string, skuId: string, stock: number) => {
  const response = await axios.put(
    `${API_BASE_URL}/product/sku/stock/${productId}/${skuId}`,
    { stock }
  );
  return response.data;
};

// 搜索商品
export const searchProducts = async (keyword: string) => {
  const response = await axios.get(`${API_BASE_URL}/product/search`, {
    params: { keyword }
  });
  return response.data;
};

// 获取商品统计
export const getProductStatistics = async () => {
  const response = await axios.get(`${API_BASE_URL}/product/statistics`);
  return response.data;
};
