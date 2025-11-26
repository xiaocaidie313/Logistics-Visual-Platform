# 物流可视化平台 API 文档

## 基础信息

- **基础URL**: `http://localhost:3002`
- **API前缀**: `/api`
- **WebSocket**: `ws://localhost:3002`

### 统一响应格式

```json
{
  "code": 200,
  "message": "Success",
  "data": {}
}
```

### 订单状态枚举

```typescript
enum OrderStatus {
  "pending"    // 待处理
  "paid"       // 已支付
  "shipped"    // 已发货
  "confirmed"  // 已确认
  "delivered"  // 已送达
  "cancelled"  // 已取消
  "refunded"   // 已退款
}
```

---

## 一、商家端 API (`/api/merchant`)

### 1. 订单管理

#### 1.1 创建订单
**POST** `/api/merchant/order`

**请求体:**
```json
{
  "id": "ORDER001",
  "orderId": "ORDER123",
  "skuname": "商品名称",
  "price": 100,
  "amount": 2,
  "totprice": 200,
  "images": "https://example.com/image.jpg",
  "arrivetime": "2024-12-31",
  "sendtime": "2024-12-25",
  "ordertime": "2024-12-20",
  "useraddress": "收货地址",
  "sendaddress": "发货地址",
  "status": "pending"
}
```

**响应:**
```json
{
  "code": 200,
  "message": "Success",
  "data": { /* 订单对象 */ }
}
```

**WebSocket事件:** 触发 `order:created` 事件

---

#### 1.2 更新订单
**PUT** `/api/merchant/order/update/:id`

**路径参数:**
- `id`: 订单ID (MongoDB _id)

**请求体:** 同创建订单

**响应:**
```json
{
  "code": 200,
  "message": "Success",
  "data": { /* 更新后的订单对象 */ }
}
```

**WebSocket事件:** 触发 `order:updated` 事件

---

#### 1.3 删除订单
**DELETE** `/api/merchant/order/delete/:id`

**路径参数:**
- `id`: 订单ID

**响应:**
```json
{
  "code": 200,
  "message": "Success",
  "data": { /* 删除的订单对象 */ }
}
```

---

#### 1.4 获取单个订单
**GET** `/api/merchant/order/get/:id`

**路径参数:**
- `id`: 订单ID

**响应:**
```json
{
  "code": 200,
  "message": "Success",
  "data": { /* 订单对象 */ }
}
```

---

#### 1.5 获取订单列表
**GET** `/api/merchant/order/list`

**响应:**
```json
{
  "code": 200,
  "message": "Success",
  "data": [ /* 订单数组 */ ]
}
```

---

#### 1.6 更新订单状态
**PUT** `/api/merchant/order/switch/status/:id`

**路径参数:**
- `id`: 订单ID

**请求体:**
```json
{
  "status": "shipped"
}
```

**响应:**
```json
{
  "code": 200,
  "message": "Success",
  "data": { /* 更新后的订单对象 */ }
}
```

**WebSocket事件:** 触发 `order:status:changed` 事件

---

#### 1.7 按状态筛选订单

##### 待处理订单
**GET** `/api/merchant/order/filter/pending`

##### 已支付订单
**GET** `/api/merchant/order/filter/paid`

##### 已发货订单
**GET** `/api/merchant/order/filter/shipped`

##### 已确认订单
**GET** `/api/merchant/order/filter/confirmed`

##### 已送达订单
**GET** `/api/merchant/order/filter/delivered`

##### 已取消订单
**GET** `/api/merchant/order/filter/cancelled`

##### 已退款订单
**GET** `/api/merchant/order/filter/refunded`

**响应:**
```json
{
  "code": 200,
  "message": "Success",
  "data": [ /* 订单数组 */ ]
}
```

---

#### 1.8 订单排序

##### 按订单时间升序
**GET** `/api/merchant/order/sort/ordertime/asc`

##### 按订单时间降序
**GET** `/api/merchant/order/sort/ordertime/des`

##### 按订单金额升序
**GET** `/api/merchant/order/sort/totprice/asc`

##### 按订单金额降序
**GET** `/api/merchant/order/sort/totprice/des`

**响应:**
```json
{
  "code": 200,
  "message": "Success",
  "data": [ /* 排序后的订单数组 */ ]
}
```

---

### 2. 物流管理

#### 2.1 创建物流记录
**POST** `/api/merchant/track`

**请求体:**
```json
{
  "id": "TRACK001",
  "orderId": "ORDER123",
  "logisticsCompany": "顺丰",
  "logisticsNumber": "SF1234567890",
  "logisticsStatus": "pending",
  "orderTime": "2024-12-20T10:00:00Z",
  "sendAddress": "北京市朝阳区",
  "userAddress": "上海市浦东新区"
}
```

**响应:**
```json
{
  "code": 200,
  "message": "Success",
  "data": { /* 物流对象 */ }
}
```

**WebSocket事件:** 触发 `logistics:updated` 事件

---

#### 2.2 获取物流信息（根据ID）
**GET** `/api/merchant/track/:id`

**路径参数:**
- `id`: 物流记录ID

**响应:**
```json
{
  "code": 200,
  "message": "Success",
  "data": { /* 物流对象 */ }
}
```

---

#### 2.3 根据订单ID查询物流
**GET** `/api/merchant/track/order/:orderId`

**路径参数:**
- `orderId`: 订单号

**响应:**
```json
{
  "code": 200,
  "message": "Success",
  "data": [ /* 物流数组 */ ]
}
```

---

#### 2.4 根据物流单号查询
**GET** `/api/merchant/track/logistics/:logisticsNumber`

**路径参数:**
- `logisticsNumber`: 物流单号

**响应:**
```json
{
  "code": 200,
  "message": "Success",
  "data": { /* 物流对象 */ }
}
```

---

#### 2.5 获取物流列表
**GET** `/api/merchant/track/list`

**响应:**
```json
{
  "code": 200,
  "message": "Success",
  "data": [ /* 物流数组 */ ]
}
```

---

#### 2.6 更新物流信息
**PUT** `/api/merchant/track/update/:id`

**路径参数:**
- `id`: 物流记录ID

**请求体:** 需要更新的字段

**响应:**
```json
{
  "code": 200,
  "message": "Success",
  "data": { /* 更新后的物流对象 */ }
}
```

**WebSocket事件:** 触发 `logistics:updated` 事件

---

#### 2.7 更新物流状态
**PUT** `/api/merchant/track/order/:orderId/status`

**路径参数:**
- `orderId`: 订单号

**请求体:**
```json
{
  "status": "shipped"
}
```

**响应:**
```json
{
  "code": 200,
  "message": "Success",
  "data": { /* 更新后的物流对象 */ }
}
```

**WebSocket事件:** 触发 `logistics:status:changed` 事件

---

#### 2.8 添加物流轨迹节点
**POST** `/api/merchant/track/:id/track`

**路径参数:**
- `id`: 物流记录ID

**请求体:**
```json
{
  "time": "2024-12-21T10:00:00Z",
  "location": "北京分拨中心",
  "description": "已发货",
  "status": "shipped",
  "operator": "张三"
}
```

**响应:**
```json
{
  "code": 200,
  "message": "Success",
  "data": { /* 更新后的物流对象（包含新轨迹节点） */ }
}
```

**WebSocket事件:** 触发 `logistics:track:added` 事件

---

#### 2.9 删除物流记录
**DELETE** `/api/merchant/track/delete/:id`

**路径参数:**
- `id`: 物流记录ID

**响应:**
```json
{
  "code": 200,
  "message": "Success",
  "data": { /* 删除的物流对象 */ }
}
```

---

### 3. 订单详情管理

#### 3.1 创建订单详情
**POST** `/api/merchant/goodsdetail`

**请求体:**
```json
{
  "id": "DETAIL001",
  "orderId": "ORDER123",
  "skuname": "商品名称",
  "status": "pending",
  "ordertime": "2024-12-20T10:00:00Z",
  "price": 100,
  "amount": 2,
  "totprice": 200,
  "totalprice": 200,
  "userinfo": {
    "id": "USER001",
    "username": "张三",
    "useraddress": "收货地址",
    "phonenumber": "13800138000"
  },
  "detail": {
    "color": "红色",
    "size": "L"
  }
}
```

**响应:**
```json
{
  "code": 200,
  "message": "Success",
  "data": { /* 订单详情对象 */ }
}
```

---

#### 3.2 更新订单详情
**PUT** `/api/merchant/goodsdetail/update/:id`

**路径参数:**
- `id`: 订单详情ID

**请求体:** 需要更新的字段

**响应:**
```json
{
  "code": 200,
  "message": "Success",
  "data": { /* 更新后的订单详情对象 */ }
}
```

---

#### 3.3 删除订单详情
**DELETE** `/api/merchant/goodsdetail/delete/:id`

**路径参数:**
- `id`: 订单详情ID

**响应:**
```json
{
  "code": 200,
  "message": "Success",
  "data": { /* 删除的订单详情对象 */ }
}
```

---

#### 3.4 获取单个订单详情
**GET** `/api/merchant/goodsdetail/get/:id`

**路径参数:**
- `id`: 订单详情ID

**响应:**
```json
{
  "code": 200,
  "message": "Success",
  "data": { /* 订单详情对象 */ }
}
```

---

#### 3.5 获取订单详情列表
**GET** `/api/merchant/goodsdetail/list`

**响应:**
```json
{
  "code": 200,
  "message": "Success",
  "data": [ /* 订单详情数组 */ ]
}
```

---

#### 3.6 根据订单ID获取订单详情
**GET** `/api/merchant/goodsdetail/order/:orderId`

**路径参数:**
- `orderId`: 订单号

**响应:**
```json
{
  "code": 200,
  "message": "Success",
  "data": [ /* 订单详情数组 */ ]
}
```

---

### 4. 用户信息管理

#### 4.1 创建用户信息
**POST** `/api/merchant/userinfo`

**请求体:**
```json
{
  "id": "USER001",
  "username": "张三",
  "useraddress": "北京市朝阳区",
  "phoneNumber": "13800138000"
}
```

**响应:**
```json
{
  "code": 200,
  "message": "Success",
  "data": { /* 用户信息对象 */ }
}
```

---

#### 4.2 更新用户信息
**PUT** `/api/merchant/userinfo/update/:id`

**路径参数:**
- `id`: 用户ID

**请求体:** 需要更新的字段

**响应:**
```json
{
  "code": 200,
  "message": "Success",
  "data": { /* 更新后的用户信息对象 */ }
}
```

---

#### 4.3 删除用户信息
**DELETE** `/api/merchant/userinfo/delete/:id`

**路径参数:**
- `id`: 用户ID

**响应:**
```json
{
  "code": 200,
  "message": "Success",
  "data": { /* 删除的用户信息对象 */ }
}
```

---

#### 4.4 获取单个用户信息
**GET** `/api/merchant/userinfo/get/:id`

**路径参数:**
- `id`: 用户ID

**响应:**
```json
{
  "code": 200,
  "message": "Success",
  "data": { /* 用户信息对象 */ }
}
```

---

#### 4.5 根据用户名获取用户信息
**GET** `/api/merchant/userinfo/username/:username`

**路径参数:**
- `username`: 用户名

**响应:**
```json
{
  "code": 200,
  "message": "Success",
  "data": { /* 用户信息对象 */ }
}
```

---

#### 4.6 获取用户信息列表
**GET** `/api/merchant/userinfo/list`

**响应:**
```json
{
  "code": 200,
  "message": "Success",
  "data": [ /* 用户信息数组 */ ]
}
```

---

## 二、用户端 API (`/api/user`)

### 1. 订单管理（只读）

#### 1.1 创建订单
**POST** `/api/user/order`

**请求体:** 同商家端创建订单

**响应:**
```json
{
  "code": 200,
  "message": "Success",
  "data": { /* 订单对象 */ }
}
```

---

#### 1.2 更新订单
**PUT** `/api/user/order/update/:id`

**路径参数:**
- `id`: 订单ID

**请求体:** 同商家端更新订单

**响应:**
```json
{
  "code": 200,
  "message": "Success",
  "data": { /* 更新后的订单对象 */ }
}
```

---

#### 1.3 删除订单
**DELETE** `/api/user/order/delete/:id`

**路径参数:**
- `id`: 订单ID

**响应:**
```json
{
  "code": 200,
  "message": "Success",
  "data": { /* 删除的订单对象 */ }
}
```

---

#### 1.4 获取单个订单
**GET** `/api/user/order/get/:id`

**路径参数:**
- `id`: 订单ID

**响应:**
```json
{
  "code": 200,
  "message": "Success",
  "data": { /* 订单对象 */ }
}
```

---

#### 1.5 获取订单列表
**GET** `/api/user/order/list`

**响应:**
```json
{
  "code": 200,
  "message": "Success",
  "data": [ /* 订单数组 */ ]
}
```

---

### 2. 物流查询（只读）

#### 2.1 根据ID查询物流
**GET** `/api/user/track/:id`

**路径参数:**
- `id`: 物流记录ID

**响应:**
```json
{
  "code": 200,
  "message": "Success",
  "data": { /* 物流对象 */ }
}
```

---

#### 2.2 根据订单ID查询物流
**GET** `/api/user/track/order/:orderId`

**路径参数:**
- `orderId`: 订单号

**响应:**
```json
{
  "code": 200,
  "message": "Success",
  "data": [ /* 物流数组 */ ]
}
```

---

#### 2.3 根据物流单号查询
**GET** `/api/user/track/logistics/:logisticsNumber`

**路径参数:**
- `logisticsNumber`: 物流单号

**响应:**
```json
{
  "code": 200,
  "message": "Success",
  "data": { /* 物流对象 */ }
}
```

---

### 3. 订单详情查询（只读）

#### 3.1 获取单个订单详情
**GET** `/api/user/goodsdetail/get/:id`

**路径参数:**
- `id`: 订单详情ID

**响应:**
```json
{
  "code": 200,
  "message": "Success",
  "data": { /* 订单详情对象 */ }
}
```

---

#### 3.2 获取订单详情列表
**GET** `/api/user/goodsdetail/list`

**响应:**
```json
{
  "code": 200,
  "message": "Success",
  "data": [ /* 订单详情数组 */ ]
}
```

---

#### 3.3 根据订单ID获取订单详情
**GET** `/api/user/goodsdetail/order/:orderId`

**路径参数:**
- `orderId`: 订单号

**响应:**
```json
{
  "code": 200,
  "message": "Success",
  "data": [ /* 订单详情数组 */ ]
}
```

---

### 4. 用户信息管理

#### 4.1 创建用户信息
**POST** `/api/user/userinfo`

**请求体:** 同商家端创建用户信息

**响应:**
```json
{
  "code": 200,
  "message": "Success",
  "data": { /* 用户信息对象 */ }
}
```

---

#### 4.2 更新用户信息
**PUT** `/api/user/userinfo/update/:id`

**路径参数:**
- `id`: 用户ID

**请求体:** 同商家端更新用户信息

**响应:**
```json
{
  "code": 200,
  "message": "Success",
  "data": { /* 更新后的用户信息对象 */ }
}
```

---

#### 4.3 删除用户信息
**DELETE** `/api/user/userinfo/delete/:id`

**路径参数:**
- `id`: 用户ID

**响应:**
```json
{
  "code": 200,
  "message": "Success",
  "data": { /* 删除的用户信息对象 */ }
}
```

---

#### 4.4 获取单个用户信息
**GET** `/api/user/userinfo/get/:id`

**路径参数:**
- `id`: 用户ID

**响应:**
```json
{
  "code": 200,
  "message": "Success",
  "data": { /* 用户信息对象 */ }
}
```

---

#### 4.5 根据用户名获取用户信息
**GET** `/api/user/userinfo/username/:username`

**路径参数:**
- `username`: 用户名

**响应:**
```json
{
  "code": 200,
  "message": "Success",
  "data": { /* 用户信息对象 */ }
}
```

---

#### 4.6 获取用户信息列表
**GET** `/api/user/userinfo/list`

**响应:**
```json
{
  "code": 200,
  "message": "Success",
  "data": [ /* 用户信息数组 */ ]
}
```

---

## 三、WebSocket 实时推送

### 连接方式

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3002', {
  transports: ['websocket']
});
```

### 房间机制

#### 加入订单房间
```javascript
socket.emit('join:order', 'ORDER123');
```

#### 离开订单房间
```javascript
socket.emit('leave:order', 'ORDER123');
```

#### 加入物流房间
```javascript
socket.emit('join:track', 'SF1234567890');
```

#### 离开物流房间
```javascript
socket.emit('leave:track', 'SF1234567890');
```

### 事件类型

#### 订单相关事件

##### order:created - 订单创建
```javascript
socket.on('order:created', (data) => {
  // data = {
  //   orderId: "ORDER123",
  //   orderData: { /* 完整订单对象 */ },
  //   timestamp: "2024-12-20T10:00:00Z"
  // }
});
```

**触发时机:** 创建订单时

---

##### order:updated - 订单更新
```javascript
socket.on('order:updated', (data) => {
  // data = {
  //   orderId: "ORDER123",
  //   orderData: { /* 更新后的订单对象 */ },
  //   timestamp: "2024-12-20T10:00:00Z"
  // }
});
```

**触发时机:** 更新订单时

---

##### order:status:changed - 订单状态变更
```javascript
socket.on('order:status:changed', (data) => {
  // data = {
  //   orderId: "ORDER123",
  //   status: "shipped",
  //   orderData: { /* 订单对象 */ },
  //   timestamp: "2024-12-20T10:00:00Z"
  // }
});
```

**触发时机:** 订单状态更新时

---

#### 物流相关事件

##### logistics:updated - 物流更新
```javascript
socket.on('logistics:updated', (data) => {
  // data = {
  //   trackingNumber: "SF1234567890",
  //   logisticsData: { /* 完整物流对象 */ },
  //   timestamp: "2024-12-20T10:00:00Z"
  // }
});
```

**触发时机:** 创建或更新物流记录时

---

##### logistics:status:changed - 物流状态变更
```javascript
socket.on('logistics:status:changed', (data) => {
  // data = {
  //   trackingNumber: "SF1234567890",
  //   status: "shipped",
  //   logisticsData: { /* 物流对象 */ },
  //   timestamp: "2024-12-20T10:00:00Z"
  // }
});
```

**触发时机:** 物流状态更新时

---

##### logistics:track:added - 物流轨迹添加
```javascript
socket.on('logistics:track:added', (data) => {
  // data = {
  //   trackingNumber: "SF1234567890",
  //   trackNode: {
  //     time: "2024-12-21T10:00:00Z",
  //     location: "北京分拨中心",
  //     description: "已发货",
  //     status: "shipped",
  //     operator: "张三"
  //   },
  //   timestamp: "2024-12-21T10:00:00Z"
  // }
});
```

**触发时机:** 添加物流轨迹节点时

---

## 四、数据模型

### 1. 订单模型 (Goods)

```typescript
{
  id: string;              // 唯一标识（必需，唯一）
  orderId: string;         // 订单号（必需）
  skuname: string;         // 商品名称（必需）
  price: number;           // 单价（必需）
  amount: number;          // 数量（必需）
  totprice: number;        // 总价（必需）
  images: string;          // 图片URL（必需）
  arrivetime: string;      // 预计送达时间（必需）
  sendtime: string;        // 发货时间（必需）
  ordertime: string;       // 下单时间（必需）
  useraddress: string;     // 收货地址（必需）
  sendaddress: string;     // 发货地址（必需）
  status: string;          // 订单状态（必需）
                            // 可选值: "pending", "paid", "shipped", 
                            //         "confirmed", "delivered", 
                            //         "cancelled", "refunded"
}
```

---

### 2. 物流模型 (Track)

```typescript
{
  id: string;                    // 唯一标识（必需，唯一）
  orderId: string;               // 订单号（必需）
  logisticsCompany: string;      // 物流公司（必需）
  logisticsNumber: string;       // 物流单号（必需，唯一）
  logisticsStatus: string;       // 物流状态（必需）
                                  // 可选值: "pending", "paid", "shipped", 
                                  //         "confirmed", "delivered", 
                                  //         "cancelled", "refunded"
  orderTime: Date;               // 下单时间（必需）
  sendTime?: Date;               // 发货时间（可选）
  receiveTime?: Date;            // 收货时间（可选）
  arriveTime?: Date;             // 到达时间（可选）
  completeTime?: Date;           // 完成时间（可选）
  fakeArriveTime?: Date;         // 预计到达时间（可选）
  sendAddress: string;           // 发货地址（必需）
  userAddress: string;           // 收货地址（必需）
  tracks: Array<{                // 物流轨迹数组
    time: Date;                  // 轨迹时间（必需）
    location: string;            // 位置（必需）
    description: string;         // 描述（必需）
    status?: string;             // 状态（可选）
    operator?: string;           // 操作员（可选）
  }>
}
```

---

### 3. 订单详情模型 (GoodsDetail)

```typescript
{
  id: string;                    // 唯一标识（必需，唯一）
  orderId: string;               // 订单号（必需）
  skuname: string;               // 商品名称（必需）
  status: string;                // 订单状态（必需）
  ordertime: Date;               // 下单时间（必需）
  price: number;                 // 单价（必需）
  amount: number;                // 数量（必需）
  totprice: number;              // 总价（必需）
  totalprice: number;            // 总价（必需）
  userinfo: {                    // 用户信息（必需）
    id: string;                  // 用户ID（必需）
    username: string;            // 用户名（必需）
    useraddress: string;         // 收货地址（必需）
    phonenumber: string;         // 电话号码（必需）
  },
  detail: {                      // 商品详情（必需）
    color: string;               // 颜色（必需）
    size: string;                // 尺寸（必需）
  }
}
```

---

### 4. 用户信息模型 (Userinfo)

```typescript
{
  id: string;                    // 唯一标识（必需，唯一）
  username: string;              // 用户名（必需，唯一）
  useraddress: string;           // 收货地址（必需）
  phoneNumber: string;           // 电话号码（必需）
}
```

---

## 五、错误码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 六、使用示例

### 完整流程示例

```javascript
// 1. 连接 WebSocket
const socket = io('http://localhost:3002');

// 2. 加入订单房间
socket.emit('join:order', 'ORDER123');

// 3. 监听订单状态变更
socket.on('order:status:changed', (data) => {
  console.log('订单状态更新:', data.status);
  // 更新UI
});

// 4. 创建订单
fetch('http://localhost:3002/api/merchant/order', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 'ORDER001',
    orderId: 'ORDER123',
    skuname: '测试商品',
    price: 100,
    amount: 1,
    totprice: 100,
    images: 'test.jpg',
    arrivetime: '2024-12-31',
    sendtime: '2024-12-25',
    ordertime: '2024-12-20',
    useraddress: '收货地址',
    sendaddress: '发货地址',
    status: 'pending'
  })
})
.then(res => res.json())
.then(data => {
  console.log('订单创建成功:', data);
  // 会自动触发 order:created 事件
});
```

---

## 七、注意事项

1. **WebSocket 房间机制**: 只有加入对应房间的客户端才能收到该订单/物流的实时更新
2. **状态枚举**: 所有状态字段必须使用预定义的状态值
3. **时间格式**: Date 类型字段使用 ISO 8601 格式
4. **唯一性约束**: `id`、`orderId`、`logisticsNumber`、`username` 等字段需要保证唯一性
5. **实时推送**: 商家端操作会自动触发 WebSocket 事件，用户端可实时接收更新
