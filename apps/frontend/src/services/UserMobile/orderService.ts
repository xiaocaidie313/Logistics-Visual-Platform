import axios from "../../utils/request";
const API_BASE_URL = 'http://localhost:3002/api/user';

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

export const getOrderList = async (userId: string) => {
    ///order/my/:userId
    const response = await axios.get(`${API_BASE_URL}/order/my/${userId}`);
    return response.data;
}