import React from "react";
import { useLocation } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { LeftOutlined } from "@ant-design/icons";
import { useAMap } from "../../components/UserMobile/MapCore/useAMap";
import PathLine from "../../components/UserMobile/MapCore/PathLine";
import CarMarker from "../../components/UserMobile/MapCore/CarMarker";
import { useNavigate } from "react-router-dom";
import { getTrackByOrderId, type Track } from "../../services/UserMobile/trackService";
import OrdertrackCard from "../../components/UserMobile/ordertrackCard";
import "./animation/ordercardload.css";
const OrderTrack: React.FC = () => {
  const location = useLocation();
  const { order } = (location.state) || {};
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentPos, setCurrentPos] = useState<[number, number] | null>(null);
  const [path, setPath] = useState<[number, number][]>([]);
  const [track, setTrack] = useState<Track | null>(null);
  const [cardLoading, setCardLoading] = useState(true);
  const [orderState, setOrderState] = useState(order); // 使用 state 来保存订单状态，以便实时更新
  // WebSocket 相关
  const socketRef = useRef<Socket | null>(null); // 保存 WebSocket 连接实例
  const trackIdRef = useRef<string | null>(null); // 保存当前跟踪的 track ID（用于过滤消息）
  
  // 初始化高德地图
  const { map, AMap } = useAMap("order-track-map-container");

  // 当 order 变化时，同步更新 orderState
  useEffect(() => {
    if (order) {
      setOrderState(order);
    }
  }, [order]);

  // 步骤 5: 连接 WebSocket 的函数（使用 useCallback 包装）
  const connectWebSocket = useCallback((orderId: string) => {
    // 如果已经有连接，先断开
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    
    // 创建新的 WebSocket 连接
    // 注意：后端使用 Socket.IO  端口是 3002
    const socket = io('http://localhost:3002', {
      transports: ['websocket'], // 强制使用 WebSocket 传输
      reconnection: true, // 自动重连
      reconnectionDelay: 1000, // 重连延迟 1 秒
    });
    
    socketRef.current = socket;
    
    // 步骤 6: 监听连接成功事件
    socket.on('connect', () => {
      console.log('WebSocket 连接成功，Socket ID:', socket.id);
      
      // 步骤 7: 加入订单房间
      socket.emit('join:order', orderId);
      
      // 步骤 8: 加入物流跟踪房间（重要！用于接收物流更新）
      if (trackIdRef.current) {
        socket.emit('join:track', trackIdRef.current);
        console.log('已加入物流跟踪房间:', trackIdRef.current);
      } else {
        console.warn('trackIdRef.current 为空，稍后会自动加入物流房间');
        // 延迟一下再尝试加入（给 trackIdRef 设置的时间）
        setTimeout(() => {
          if (trackIdRef.current && socket.connected) {
            socket.emit('join:track', trackIdRef.current);
            console.log('延迟加入物流房间:', trackIdRef.current);
          }
        }, 500);
      }
    });
    
    // 步骤 9: 监听连接错误事件
    socket.on('connect_error', (error) => {
      console.error('WebSocket 连接失败:', error);
    });
    
    // 步骤 10: 监听断开连接事件
    socket.on('disconnect', (reason) => {
      console.log('WebSocket 断开连接:', reason);
    });
    
    // 步骤 11: 监听物流更新事件
    socket.on('logistics:updated', (data: {
      trackingNumber: string;
      logisticsData: Track;
      timestamp: Date;
    }) => {
      console.log('收到物流更新:', data);
      
      // 步骤 12: 过滤消息
      // 后端推送的数据格式：{ trackingNumber, logisticsData, timestamp }
      if (data.trackingNumber === trackIdRef.current && data.logisticsData) {
        const logisticsData = data.logisticsData;
        
        // 步骤 13: 更新当前位置（如果物流数据中有新的位置）
        if (logisticsData.currentCoords && 
            Array.isArray(logisticsData.currentCoords) && 
            logisticsData.currentCoords.length >= 2) {
          const lng = logisticsData.currentCoords[0];
          const lat = logisticsData.currentCoords[1];
          if (typeof lng === 'number' && typeof lat === 'number' && lng !== undefined && lat !== undefined) {
            const newPos: [number, number] = [lng, lat];
            console.log('更新车辆位置:', newPos);
            setCurrentPos(newPos);
          }
        }
        
        // 步骤 14: 更新 track 数据（用于更新物流轨迹等信息）
        setTrack(logisticsData as Track);
      }
    });
    
    // 步骤 15: 监听物流状态变更事件
    socket.on('logistics:status:changed', (data: {
      trackingNumber: string;
      status: string;
      logisticsData?: Track;
      timestamp: Date;
    }) => {
      console.log('收到物流状态变更:', data);
      if (data.trackingNumber === trackIdRef.current) {
        // 状态变更时，重新获取完整数据
        getTrackByOrderId(orderId).then((res) => {
          const trackData = res.data?.[0];
          if (trackData) {
            setTrack(trackData as Track);
          }
        }).catch((error) => {
          console.error('获取物流信息失败:', error);
        });
      }
    });
    
    // 步骤 16: 监听物流轨迹添加事件
    socket.on('logistics:track:added', (data: {
      trackingNumber: string;
      trackNode: unknown;
      timestamp: Date;
    }) => {
      console.log('收到物流轨迹添加:', data);
      if (data.trackingNumber === trackIdRef.current) {
        // 轨迹添加时，重新获取完整数据
        getTrackByOrderId(orderId).then((res) => {
          const trackData = res.data?.[0];
          if (trackData) {
            setTrack(trackData as Track);
          }
        }).catch((error) => {
          console.error('获取物流信息失败:', error);
        });
      }
    });
    
    // 步骤 17: 监听订单状态变更事件（重要！用于更新订单状态显示）
    socket.on('order:status:changed', (data: {
      orderId: string;
      status: string;
      orderData?: {
        orderId?: string;
        status?: string;
        [key: string]: unknown;
      };
      timestamp: Date;
    }) => {
      console.log('收到订单状态变更:', data);
      // 只处理当前订单的状态变更
      if (data.orderId === orderId) {
        // 更新订单状态
        setOrderState((prevOrder: typeof order | null) => {
          if (!prevOrder) return prevOrder;
          return {
            ...prevOrder,
            ...(data.orderData || {}),
            status: data.status,
          };
        });
        console.log('订单状态已更新为:', data.status);
      }
    });
  }, []);

  useEffect(() => {
    if (!order) {
      console.warn("未找到订单信息");
      return;
    }
    console.log("订单信息:", order);
    setLoading(true);
    
    // 步骤 1: 获取物流信息（初始数据）
    getTrackByOrderId(order.orderId)
      .then((res) => {
        console.log("物流信息:", res);
        // API 返回的是数组，取第一个
        const trackData = res.data[0];
        
        // 如果没有物流信息，说明商家还未发货
        if (!trackData) {
          console.warn("该订单尚未发货，暂无物流信息");
          setTrack(null);
          setLoading(false);
          return;
        }
        
        setTrack(trackData as Track);
        
        // 步骤 2: 保存 track ID，用于后续 WebSocket 消息过滤
        if (trackData?.logisticsNumber) {
          trackIdRef.current = trackData.logisticsNumber;
          console.log("设置 trackIdRef:", trackIdRef.current);
        }
      
        // 展平 path 数组
        const flatPath: [number, number][] = [];
        if (trackData?.path && Array.isArray(trackData.path) && trackData.path.length > 0) {
          // path 可能是嵌套数组，需要展平
          // 需要展平成: [[lng1,lat1], [lng2,lat2], ..., [lng101,lat101], ...]
          trackData.path.forEach((item: unknown) => {
            if (Array.isArray(item)) {
              // 检查是否是嵌套数组（第一个元素也是数组）
              if (item.length > 0 && Array.isArray(item[0])) {
                // 是嵌套数组，展平
                item.forEach((point: unknown) => {
                  if (Array.isArray(point) && point.length >= 2) {
                    const lng = point[0];
                    const lat = point[1];
                    if (typeof lng === 'number' && typeof lat === 'number') {
                      flatPath.push([lng, lat]);
                    }
                  }
                });
              } else if (item.length >= 2) {
                // 已经是单个点 [lng, lat]
                const lng = item[0];
                const lat = item[1];
                if (typeof lng === 'number' && typeof lat === 'number') {
                  flatPath.push([lng, lat]);
                }
              }
            }
          });
          
          if (flatPath.length > 0) {
            setPath(flatPath);
          } else {
            console.warn("展平后路径为空");
          }
        } else {
          console.warn("路径数据无效或为空");
        }
        
        // 设置当前位置
        if (trackData?.currentCoords && Array.isArray(trackData.currentCoords) && trackData.currentCoords.length >= 2) {
          const coords = [trackData.currentCoords[0], trackData.currentCoords[1]] as [number, number];
          setCurrentPos(coords);
        } else if (flatPath.length > 0 && flatPath[0]) {
          // 如果没有当前位置，使用路径起点

          setCurrentPos(flatPath[0]);
        }
        if (flatPath.length > 0) {
          setTimeout(() => {
            // 在 setTimeout 中访问最新的 map 和 AMap
            // 由于闭包特性，这里会访问到最新的值
            if (map && AMap && flatPath.length > 0) {
              const polyline = new AMap.Polyline({ path: flatPath });
              map.setFitView([polyline]);
            }
          }, 500);
        }

        // 步骤 3: 在获取到 track 数据后，连接 WebSocket（确保 trackIdRef 已设置）
        if (trackIdRef.current) {
          connectWebSocket(order.orderId);
        } else {
          console.warn("未找到 logisticsNumber，无法连接 WebSocket");
        }
      })
      .catch((error) => {
        console.error("获取物流信息失败:", error);
      })
      .finally(() => {
        setLoading(false);
        setTimeout(() => {
          setCardLoading(false);
        }, 300);
        });
    
    // 步骤 4: 组件卸载时清理 WebSocket 连接
    return () => {
      if (socketRef.current) {
        console.log("关闭 WebSocket 连接");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [order, map, AMap, connectWebSocket]);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* 顶部返回按钮 - 浮在地图上 */}
      <LeftOutlined
        onClick={() => navigate(-1)}
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          fontSize: "20px",
          color: "#333",
          cursor: "pointer",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          borderRadius: "50%",
          width: "32px",
          height: "32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          zIndex: 1000,
        }}
      />

      {/* 如果没有物流信息，显示提示 */}
      {!loading && !track ? (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            padding: "20px",
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 1000,
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📦</div>
          <div style={{ fontSize: "18px", fontWeight: "600", color: "#333", marginBottom: "8px" }}>
            商家尚未发货
          </div>
          <div style={{ fontSize: "14px", color: "#666" }}>
            请等待商家发货后查看物流信息
          </div>
        </div>
      ) : (
        <>
          {/* 地图容器 - 全屏背景 */}
          <div
            id="order-track-map-container"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100%",
              height: "100vh",
              backgroundColor: "#f5f5f5",
            }}
          />

          {/* 地图组件 - 只有在有物流信息时才显示 */}
          {track && map && AMap && (
            <>
              {path.length > 0 && (
                <PathLine
                  key={`path-${order?.orderId || 'default'}`}
                  map={map}
                  AMap={AMap}
                  path={path}
                  currentPosition={currentPos}
                />
              )}
              {currentPos && (
                <CarMarker
                  key={`car-${order?.orderId || 'default'}`}
                  map={map}
                  AMap={AMap}
                  position={currentPos}
                />
              )}
            </>
          )}
        </>
      )}

      {/* 浮动信息卡片 - 底部抽屉样式 */}
      <div
        className={`orderTrackCard ${cardLoading ? "loading" : ""}`}
      >
        {/* 拖拽指示条 */}
        <div
          style={{
            width: "40px",
            height: "4px",
            backgroundColor: "#ddd",
            borderRadius: "2px",
            margin: "8px auto",
          }}
        />

        {/* 卡片内容区域 - 可滚动 */}
        <OrdertrackCard order={orderState} track={track} loading={loading} />
      </div>
    </div>
  );
};

export default OrderTrack;
