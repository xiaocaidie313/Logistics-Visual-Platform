import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';

// 生成全局的 io 实例 全局的 socketio服务器
let io: SocketServer | null = null;

// 初始化 WebSocket 服务器  需要一个http服务
export const WebSocketServer = (httpServer: HttpServer) => {
  io = new SocketServer(httpServer, { // 生产socketio 服务器 通过传入的 httpServer 创建
    cors: {
      origin: "*", // 允许访问的域名
      methods: ["GET", "POST","PUT","DELETE"]
    }
    /*
        serveClient: false, // 不自动提供客户端库
        path: "/socket.io", // 自定义路径
        adapter: /* 自定义适配器配置 */ 
        // cookie: "myapp" // 自定义 Cookie 名称
});
  /*
  */
 // 房间机制
  io.on('connection', (socket: Socket) => {
    console.log(`客户端连接: ${socket.id}`);

    // 客户端加入特定订单的房间
    // 封装独特的join leave
    socket.on('join:order', (orderId: string) => {
      socket.join(`order:${orderId}`);
      console.log(`客户端 ${socket.id} 加入订单房间: order:${orderId}`);
    });

    // 客户端离开订单房间
    socket.on('leave:order', (orderId: string) => {
      socket.leave(`order:${orderId}`);
      console.log(`客户端 ${socket.id} 离开订单房间: order:${orderId}`);
    });

    // 客户端加入物流跟踪房间
    socket.on('join:track', (trackingNumber: string) => {
      socket.join(`track:${trackingNumber}`);
      console.log(`加入物流房间: ${socket.id} track:${trackingNumber}`);
    });

    // 客户端离开物流跟踪房间
    socket.on('leave:track', (trackingNumber: string) => {
      socket.leave(`track:${trackingNumber}`);
      console.log(`离开物流房间: ${socket.id} track:${trackingNumber}`);
    });

    // 断开连接
    socket.on('disconnect', () => {
      console.log(`客户端断开连接: ${socket.id}`);
    });
  });

  return io;
};

// 获取 WebSocket 全局的 io
export const getIO = (): SocketServer => {
  if (!io) {
    throw new Error('WebSocket 服务器未初始化');
  }
  return io;
};
// !!!!!!!
// 事件类型定义
export enum SocketEvents {
  // 订单相关事件
  ORDER_CREATED = 'order:created',
  ORDER_UPDATED = 'order:updated',
  ORDER_STATUS_CHANGED = 'order:status:changed',
  ORDER_DELETED = 'order:deleted',
  
  // 物流相关事件
  LOGISTICS_CREATED = 'logistics:created',
  LOGISTICS_UPDATED = 'logistics:updated',
  LOGISTICS_STATUS_CHANGED = 'logistics:status:changed',
  LOGISTICS_TRACK_ADDED = 'logistics:track:added',
  LOGISTICS_DELETED = 'logistics:deleted',
  
  // 通用事件
  ERROR = 'error',
  NOTIFICATION = 'notification'
}

// 推送订单状态更新
export const emitOrderStatusChange = (orderId: string, status: string, orderData?: unknown) => {
  const socketIO = getIO();
  const eventData = {
    orderId,
    status,
    orderData,
    timestamp: new Date()
  };
  // 发送到特定订单房间
  socketIO.to(`order:${orderId}`).emit(SocketEvents.ORDER_STATUS_CHANGED, eventData);
  // 同时进行全局广播，确保所有客户端都能收到
  socketIO.emit(SocketEvents.ORDER_STATUS_CHANGED, eventData);
};

// 推送订单更新
export const emitOrderUpdate = (orderId: string, orderData: unknown) => {
  const socketIO = getIO();
  socketIO.to(`order:${orderId}`).emit(SocketEvents.ORDER_UPDATED, {
    orderId,
    orderData,
    timestamp: new Date()
  });
};

// 推送订单创建
export const emitOrderCreated = (orderId: string, orderData: unknown) => {
  const socketIO = getIO();
  socketIO.to(`order:${orderId}`).emit(SocketEvents.ORDER_CREATED, {
    orderId,
    orderData,
    timestamp: new Date()
  });
};

// 推送物流状态更新
export const emitLogisticsStatusChange = (trackingNumber: string, status: string, logisticsData?: unknown) => {
  const socketIO = getIO();
  socketIO.to(`track:${trackingNumber}`).emit(SocketEvents.LOGISTICS_STATUS_CHANGED, {
    trackingNumber,
    status,
    logisticsData,
    timestamp: new Date()
  });
};

// 推送物流轨迹更新
export const emitLogisticsTrackAdded = (trackingNumber: string, trackNode: unknown) => {
  const socketIO = getIO();
  socketIO.to(`track:${trackingNumber}`).emit(SocketEvents.LOGISTICS_TRACK_ADDED, {
    trackingNumber,
    trackNode,
    timestamp: new Date()
  });
};

// 推送物流更新
export const emitLogisticsUpdate = (trackingNumber: string, logisticsData: unknown) => {
  const socketIO = getIO();
  socketIO.to(`track:${trackingNumber}`).emit(SocketEvents.LOGISTICS_UPDATED, {
    trackingNumber,
    logisticsData,
    timestamp: new Date()
  });
};

// 广播通知（发送给所有连接的客户端）
export const broadcastNotification = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
  const socketIO = getIO();
  socketIO.emit(SocketEvents.NOTIFICATION, {
    message,
    type,
    timestamp: new Date()
  });
};

