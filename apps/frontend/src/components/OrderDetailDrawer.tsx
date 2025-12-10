import React, { useState, useEffect, useRef } from 'react';
import { Drawer, Descriptions, Image, Tag, Space, Timeline, Divider, Tabs, Spin, Steps, Button } from 'antd';
import { EnvironmentOutlined, CarOutlined, LoadingOutlined } from '@ant-design/icons';
import type { Order, OrderStatus } from '../services/orderService';
import { getTrackByOrderId, type Track, type TrackNode } from '../services/trackService';
import dayjs from 'dayjs';
import { io, Socket } from 'socket.io-client';
import { useAMap } from '../hooks/useAMap';
import PathLine from './MapCore/PathLine';
import CarMarker from './MapCore/CarMarker';
import PickupCodeDisplay from './UserMobile/PickupCodeDisplay';

interface OrderDetailDrawerProps {
  open: boolean;
  order: Order | null;
  onClose: () => void;
  onOrderUpdate?: (order: Order) => void; // 添加回调函数，用于通知父组件更新
}

const OrderDetailDrawer: React.FC<OrderDetailDrawerProps> = ({ open, order, onClose, onOrderUpdate }) => {
  const [currentOrder, setCurrentOrder] = useState<Order | null>(order);
  const [track, setTrack] = useState<Track | null>(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('1');
  const socketRef = useRef<Socket | null>(null);
  const trackIdRef = useRef<string | null>(null);
  const [currentPos, setCurrentPos] = useState<[number, number] | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [flatPath, setFlatPath] = useState<[number, number][]>([]);
  
  // 延迟初始化地图，等待DOM完全渲染
  useEffect(() => {
    if (activeTab === '2' && open && track) {
      // 延迟标记地图容器准备就绪
      const timer = setTimeout(() => {
        setMapReady(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setMapReady(false);
    }
  }, [activeTab, open, track]);

  // 只在地图容器准备好时初始化
  const { map, AMap } = useAMap(mapReady ? 'logistics-map-container' : '');

  // 同步父组件传入的order
  useEffect(() => {
    setCurrentOrder(order);
  }, [order]);

  // 获取物流信息
  const loadTrackInfo = async () => {
    if (!currentOrder?.orderId) return;
    
    setTrackLoading(true);
    try {
      const response = await getTrackByOrderId(currentOrder.orderId);
      if (response.code === 200 && response.data && response.data.length > 0) {
        const trackData = response.data[0];
        if (trackData) {
          setTrack(trackData);
          // 保存物流单号用于WebSocket过滤
          if (trackData?.logisticsNumber) {
            trackIdRef.current = trackData.logisticsNumber;
            // 如果WebSocket已连接，加入物流房间
            if (socketRef.current?.connected) {
              socketRef.current.emit('join:track', trackData.logisticsNumber);
              console.log('[订单详情] 加入物流房间:', trackData.logisticsNumber);
            }
          }
          
          // 设置当前位置
          if (trackData?.currentCoords && Array.isArray(trackData.currentCoords) && trackData.currentCoords.length >= 2) {
            const lng = trackData.currentCoords[0];
            const lat = trackData.currentCoords[1];
            if (typeof lng === 'number' && typeof lat === 'number') {
              setCurrentPos([lng, lat]);
            }
          }
          
          // 展平路径数据（处理嵌套数组）
          if (trackData?.path && Array.isArray(trackData.path) && trackData.path.length > 0) {
            const flattened: [number, number][] = [];
            trackData.path.forEach((item: unknown) => {
              if (Array.isArray(item)) {
                if (item.length > 0 && Array.isArray(item[0])) {
                  // 嵌套数组
                  item.forEach((point: unknown) => {
                    if (Array.isArray(point) && point.length >= 2) {
                      const lng = point[0];
                      const lat = point[1];
                      if (typeof lng === 'number' && typeof lat === 'number') {
                        flattened.push([lng, lat]);
                      }
                    }
                  });
                } else if (item.length >= 2) {
                  // 单个点
                  const lng = item[0];
                  const lat = item[1];
                  if (typeof lng === 'number' && typeof lat === 'number') {
                    flattened.push([lng, lat]);
                  }
                }
              }
            });
            setFlatPath(flattened);
          } else {
            setFlatPath([]);
          }
        }
      } else {
        setTrack(null);
        trackIdRef.current = null;
        setFlatPath([]);
        setCurrentPos(null);
      }
    } catch (error) {
      console.error('获取物流信息失败:', error);
      setTrack(null);
      trackIdRef.current = null;
    } finally {
      setTrackLoading(false);
    }
  };

  // 当切换到物流追踪标签页且有地图和路径数据时，自动适配视野
  useEffect(() => {
    if (activeTab === '2' && map && AMap && flatPath.length > 0) {
      setTimeout(() => {
        try {
          const polyline = new AMap.Polyline({ path: flatPath });
          map.setFitView([polyline]);
        } catch (error) {
          console.error('适配地图视野失败:', error);
        }
      }, 300);
    }
  }, [activeTab, map, AMap, flatPath]);

  // 连接WebSocket
  const connectWebSocket = () => {
    if (!currentOrder?.orderId) return;

    // 如果已有连接，先断开
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = io('http://localhost:3002', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[订单详情] WebSocket 连接成功');
      // 加入订单房间
      socket.emit('join:order', currentOrder.orderId);
      // 如果有物流单号，加入物流房间
      if (trackIdRef.current) {
        socket.emit('join:track', trackIdRef.current);
        console.log('[订单详情] 加入物流房间:', trackIdRef.current);
      } else {
        // 如果还没有物流单号，延迟一下再尝试加入（给 loadTrackInfo 时间）
        setTimeout(() => {
          if (trackIdRef.current && socket.connected) {
            socket.emit('join:track', trackIdRef.current);
            console.log('[订单详情] 延迟加入物流房间:', trackIdRef.current);
          }
        }, 500);
      }
    });

    socket.on('connect_error', (error) => {
      console.error('[订单详情] WebSocket 连接失败:', error);
    });

    // 监听订单状态变更
    socket.on('order:status:changed', (data: {
      orderId: string;
      status: string;
      orderData?: Order;
      timestamp: Date;
    }) => {
      if (data.orderId === currentOrder.orderId) {
        console.log('[订单详情] 订单状态更新:', data);
        const updatedOrder = {
          ...currentOrder,
          ...(data.orderData || {}),
          status: data.status as OrderStatus,
        };
        setCurrentOrder(updatedOrder);
        // 通知父组件更新
        if (onOrderUpdate) {
          onOrderUpdate(updatedOrder);
        }
      }
    });

    // 监听物流更新
    socket.on('logistics:updated', (data: {
      trackingNumber: string;
      logisticsData: Track;
      timestamp: Date;
    }) => {
      if (data.trackingNumber === trackIdRef.current) {
        console.log('[订单详情] 物流信息更新:', data);
        const logisticsData = data.logisticsData;
        
        // 更新 track 数据
        setTrack(logisticsData);
        
        // 更新当前位置（如果物流数据中有新的位置）
        if (logisticsData.currentCoords && 
            Array.isArray(logisticsData.currentCoords) && 
            logisticsData.currentCoords.length >= 2) {
          const lng = logisticsData.currentCoords[0];
          const lat = logisticsData.currentCoords[1];
          if (typeof lng === 'number' && typeof lat === 'number') {
            const newPos: [number, number] = [lng, lat];
            console.log('[订单详情] 更新车辆位置:', newPos);
            setCurrentPos(newPos);
          }
        }
        
        // 更新路径数据（展平处理）
        if (logisticsData.path && Array.isArray(logisticsData.path) && logisticsData.path.length > 0) {
          const flattened: [number, number][] = [];
          logisticsData.path.forEach((item: unknown) => {
            if (Array.isArray(item)) {
              if (item.length > 0 && Array.isArray(item[0])) {
                item.forEach((point: unknown) => {
                  if (Array.isArray(point) && point.length >= 2) {
                    const lng = point[0];
                    const lat = point[1];
                    if (typeof lng === 'number' && typeof lat === 'number') {
                      flattened.push([lng, lat]);
                    }
                  }
                });
              } else if (item.length >= 2) {
                const lng = item[0];
                const lat = item[1];
                if (typeof lng === 'number' && typeof lat === 'number') {
                  flattened.push([lng, lat]);
                }
              }
            }
          });
          setFlatPath(flattened);
        }
      }
    });

    // 监听物流状态变更
    socket.on('logistics:status:changed', (data: {
      trackingNumber: string;
      status: string;
      logisticsData?: Track;
      timestamp: Date;
    }) => {
      if (data.trackingNumber === trackIdRef.current) {
        console.log('[订单详情] 物流状态变更:', data);
        if (data.logisticsData) {
          const logisticsData = data.logisticsData;
          setTrack(logisticsData);
          
          // 更新当前位置
          if (logisticsData.currentCoords && 
              Array.isArray(logisticsData.currentCoords) && 
              logisticsData.currentCoords.length >= 2) {
            const lng = logisticsData.currentCoords[0];
            const lat = logisticsData.currentCoords[1];
            if (typeof lng === 'number' && typeof lat === 'number') {
              setCurrentPos([lng, lat]);
            }
          }
          
          // 更新路径数据（展平处理）
          if (logisticsData.path && Array.isArray(logisticsData.path) && logisticsData.path.length > 0) {
            const flattened: [number, number][] = [];
            logisticsData.path.forEach((item: unknown) => {
              if (Array.isArray(item)) {
                if (item.length > 0 && Array.isArray(item[0])) {
                  item.forEach((point: unknown) => {
                    if (Array.isArray(point) && point.length >= 2) {
                      const lng = point[0];
                      const lat = point[1];
                      if (typeof lng === 'number' && typeof lat === 'number') {
                        flattened.push([lng, lat]);
                      }
                    }
                  });
                } else if (item.length >= 2) {
                  const lng = item[0];
                  const lat = item[1];
                  if (typeof lng === 'number' && typeof lat === 'number') {
                    flattened.push([lng, lat]);
                  }
                }
              }
            });
            setFlatPath(flattened);
          }
        } else {
          // 如果没有完整数据，重新加载
          loadTrackInfo();
        }
      }
    });

    // 监听物流轨迹添加
    socket.on('logistics:track:added', (data: {
      trackingNumber: string;
      trackNode: TrackNode;
      timestamp: Date;
    }) => {
      if (data.trackingNumber === trackIdRef.current) {
        console.log('[订单详情] 物流轨迹添加:', data);
        // 重新加载物流信息
        loadTrackInfo();
      }
    });
    
    // 监听位置更新
    socket.on('location:updated', (data: {
      trackingNumber: string;
      position: [number, number];
      timestamp: Date;
    }) => {
      if (data.trackingNumber === trackIdRef.current && data.position) {
        console.log('[订单详情] 位置更新:', data);
        setCurrentPos(data.position);
      }
    });
  };

  // 当抽屉打开且订单信息存在时，加载物流信息并连接WebSocket
  useEffect(() => {
    if (open && currentOrder) {
      loadTrackInfo();
      connectWebSocket();
      setActiveTab('1'); // 重置到第一个标签页
    } else if (!open) {
      // 关闭抽屉时清理数据
      setTrack(null);
      setCurrentPos(null);
      setFlatPath([]);
      trackIdRef.current = null;
    }

    // 清理函数：关闭抽屉时断开WebSocket
    return () => {
      if (socketRef.current && !open) {
        console.log('[订单详情] 关闭 WebSocket 连接');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentOrder?.orderId]);

  if (!currentOrder) return null;

  const statusConfig: Record<OrderStatus, { color: string; text: string }> = {
    pending: { color: 'default', text: '待支付' },
    paid: { color: 'processing', text: '已支付' },
    shipped: { color: 'blue', text: '已发货' },
    confirmed: { color: 'cyan', text: '已确认' },
    delivered: { color: 'success', text: '已送达' },
    cancelled: { color: 'error', text: '已取消' },
    refunded: { color: 'warning', text: '已退款' },
  };

  const getTimelineItems = () => {
    if (!currentOrder) return [];
    
    const items = [
      {
        content: (
          <>
            <div><strong>订单创建</strong></div>
            <div style={{ color: '#888', fontSize: 12 }}>
              {dayjs(currentOrder.ordertime).format('YYYY-MM-DD HH:mm:ss')}
            </div>
          </>
        ),
        color: 'gray',
      },
    ];

    if (currentOrder.status !== 'pending') {
      items.push({
        content: (
          <>
            <div><strong>订单支付</strong></div>
            <div style={{ color: '#888', fontSize: 12 }}>订单已支付</div>
          </>
        ),
        color: 'blue',
      });
    }

    if (currentOrder.status === 'shipped' || currentOrder.status === 'confirmed' || currentOrder.status === 'delivered') {
      items.push({
        content: (
          <>
            <div><strong>订单发货</strong></div>
            <div style={{ color: '#888', fontSize: 12 }}>
              {dayjs(currentOrder.sendtime).format('YYYY-MM-DD HH:mm:ss')}
            </div>
          </>
        ),
        color: 'blue',
      });
    }

    if (currentOrder.status === 'delivered') {
      items.push({
        content: (
          <>
            <div><strong>订单送达</strong></div>
            <div style={{ color: '#888', fontSize: 12 }}>
              {dayjs(currentOrder.arrivetime).format('YYYY-MM-DD HH:mm:ss')}
            </div>
          </>
        ),
        color: 'green',
      });
    }

    if (currentOrder.status === 'cancelled') {
      items.push({
        content: (
          <>
            <div><strong>订单取消</strong></div>
            <div style={{ color: '#888', fontSize: 12 }}>订单已取消</div>
          </>
        ),
        color: 'red',
      });
    }

    if (currentOrder.status === 'refunded') {
      items.push({
        content: (
          <>
            <div><strong>订单退款</strong></div>
            <div style={{ color: '#888', fontSize: 12 }}>订单已退款</div>
          </>
        ),
        color: 'orange',
      });
    }

    return items;
  };

  // 物流轨迹步骤
  const getLogisticsSteps = () => {
    if (!track || !track.tracks || track.tracks.length === 0) {
      return [];
    }

    return track.tracks.map((trackItem: TrackNode, index: number) => {
      const date = new Date(trackItem.time);
      const timeStr = `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
      
      // 判断是否是最后一条且状态为已送达
      const isLastDelivered = index === track.tracks!.length - 1 && 
                              trackItem.status === 'delivered' && 
                              track.pickupCode;
      
      return {
        title: trackItem.description || trackItem.location,
        content: (
          <div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
              {timeStr} {trackItem.location || ''}
            </div>
            {/* 如果是最后一条已送达记录且有取件码，显示取件码 */}
            {isLastDelivered && (
              <div style={{ marginTop: 8, padding: '8px 12px', backgroundColor: '#f0f9ff', borderRadius: '4px', border: '1px solid #91d5ff' }}>
                <div style={{ fontSize: 14, fontWeight: 'bold', color: '#1890ff', marginBottom: 4 }}>
                  取件码：{track.pickupCode}
                </div>
                {track.pickupLocation && (
                  <div style={{ fontSize: 12, color: '#666' }}>
                    自提点：{track.pickupLocation}
                  </div>
                )}
                {track.pickupCodeExpiresAt && (
                  <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                    有效期至：{new Date(track.pickupCodeExpiresAt).toLocaleString('zh-CN')}
                  </div>
                )}
              </div>
            )}
          </div>
        ),
        status: 'finish',
      };
    });
  };

  return (
    <Drawer
      title={`订单详情 - ${currentOrder.orderId}`}
      placement="right"
      size="large"
      onClose={onClose}
      open={open}
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: '1',
            label: '订单信息',
            children: (
              <Space vertical size="large" style={{ width: '100%' }}>
        {/* 订单状态 */}
        <div>
          <Tag color={statusConfig[currentOrder.status].color} style={{ fontSize: 16, padding: '4px 16px' }}>
            {statusConfig[currentOrder.status].text}
          </Tag>
        </div>

        {/* 商品信息 */}
        <div>
          <Divider>商品信息</Divider>
          <Space vertical size="middle" style={{ width: '100%' }}>
            <Image
              src={currentOrder.images}
              alt={currentOrder.skuname}
              style={{ width: '100%', maxHeight: 300, objectFit: 'cover' }}
              fallback="data:image/png;base64,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"
            />
            <Descriptions column={1} size="small">
              <Descriptions.Item label="商品名称">{currentOrder.skuname}</Descriptions.Item>
              <Descriptions.Item label="单价">¥{currentOrder.price?.toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="数量">{currentOrder.amount}</Descriptions.Item>
              <Descriptions.Item label="总价">
                <span style={{ color: '#ff4d4f', fontSize: 16, fontWeight: 600 }}>
                  ¥{currentOrder.totprice?.toFixed(2)}
                </span>
              </Descriptions.Item>
            </Descriptions>
          </Space>
        </div>

        {/* 收发货地址 */}
        <div>
          <Divider>物流信息</Divider>
          <Space vertical size="middle" style={{ width: '100%' }}>
            <div>
              <div style={{ marginBottom: 8 }}>
                <EnvironmentOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                <strong>发货地址</strong>
              </div>
              <div style={{ paddingLeft: 24, color: '#666' }}>{currentOrder.sendaddress}</div>
            </div>
            <div>
              <div style={{ marginBottom: 8 }}>
                <EnvironmentOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                <strong>收货地址</strong>
              </div>
              <div style={{ paddingLeft: 24, color: '#666' }}>{currentOrder.useraddress}</div>
            </div>
          </Space>
        </div>

        {/* 订单时间线 */}
        <div>
          <Divider>订单进度</Divider>
          <Timeline items={getTimelineItems()} />
        </div>

        {/* 订单信息 */}
        <div>
          <Divider>订单信息</Divider>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="订单ID">{currentOrder.id}</Descriptions.Item>
            <Descriptions.Item label="订单编号">{currentOrder.orderId}</Descriptions.Item>
            <Descriptions.Item label="下单时间">
              {dayjs(currentOrder.ordertime).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            {currentOrder.sendtime && (
              <Descriptions.Item label="发货时间">
                {dayjs(currentOrder.sendtime).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            )}
            {currentOrder.arrivetime && (
              <Descriptions.Item label="送达时间">
                {dayjs(currentOrder.arrivetime).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            )}
          </Descriptions>
        </div>
              </Space>
            ),
          },
          {
            key: '2',
            label: (
              <span>
                <CarOutlined /> 物流追踪
              </span>
            ),
            children: (
              <Space vertical size="large" style={{ width: '100%' }}>
                {trackLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                    <div style={{ marginTop: 10, color: '#999' }}>正在加载物流信息...</div>
                  </div>
                ) : track ? (
                  <>
                    {/* 地图容器 */}
                    <div
                      style={{
                        width: '100%',
                        height: '400px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        position: 'relative',
                        backgroundColor: '#f5f5f5',
                      }}
                    >
                      <div
                        id="logistics-map-container"
                        style={{ width: '100%', height: '100%' }}
                      />
                      
                      {/* 地图渲染路线和标记 */}
                      {map && AMap && flatPath.length > 0 && (
                        <>
                          <PathLine
                            map={map}
                            AMap={AMap}
                            path={flatPath}
                            currentPosition={currentPos}
                          />
                          {currentPos && (
                            <CarMarker
                              map={map}
                              AMap={AMap}
                              position={currentPos}
                            />
                          )}
                        </>
                      )}
                    </div>

                    {/* 物流公司信息 */}
                    <div
                      style={{
                        backgroundColor: '#fafafa',
                        borderRadius: '12px',
                        padding: '16px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '12px',
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: '12px',
                              color: '#999',
                              marginBottom: '4px',
                            }}
                          >
                            物流公司
                          </div>
                          <div
                            style={{
                              fontSize: '20px',
                              fontWeight: 'bold',
                              color: '#333',
                            }}
                          >
                            {track.logisticsCompany || '未知物流'}
                          </div>
                          <div
                            style={{
                              fontSize: '14px',
                              color: '#666',
                              marginTop: '4px',
                            }}
                          >
                            运单号：{track.logisticsNumber || currentOrder.orderId}
                          </div>
                        </div>
                        <Tag
                          color={track.logisticsStatus === 'delivered' ? 'success' : 'processing'}
                          style={{
                            borderRadius: '10px',
                            padding: '4px 12px',
                            fontSize: '14px',
                          }}
                        >
                          {track.logisticsStatus === 'delivered' ? '已送达' : '运输中'}
                        </Tag>
                      </div>

                      {/* 取件码显示 */}
                      <PickupCodeDisplay
                        pickupCode={track.pickupCode}
                        pickupLocation={track.pickupLocation}
                        expiresAt={track.pickupCodeExpiresAt}
                        logisticsStatus={track.logisticsStatus}
                      />

                      {/* 发货/收货地址 */}
                      <div style={{ marginTop: '16px' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            marginBottom: '12px',
                          }}
                        >
                          <div
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              backgroundColor: '#faad14',
                              color: '#fff',
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: '12px',
                              flexShrink: 0,
                              marginTop: '2px',
                            }}
                          >
                            发
                          </div>
                          <div
                            style={{
                              fontSize: '14px',
                              color: '#333',
                              lineHeight: '1.5',
                              flex: 1,
                            }}
                          >
                            {track.sendAddress || currentOrder.sendaddress || '未知地址'}
                          </div>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                          }}
                        >
                          <div
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              backgroundColor: '#52c41a',
                              color: '#fff',
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: '12px',
                              flexShrink: 0,
                              marginTop: '2px',
                            }}
                          >
                            收
                          </div>
                          <div
                            style={{
                              fontSize: '14px',
                              color: '#333',
                              lineHeight: '1.5',
                              flex: 1,
                            }}
                          >
                            {track.userAddress || currentOrder.useraddress || '未知地址'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 物流轨迹 */}
                    <div
                      style={{
                        backgroundColor: '#fafafa',
                        borderRadius: '12px',
                        padding: '16px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#333',
                          marginBottom: '16px',
                        }}
                      >
                        物流详情
                      </div>
                      {track.tracks && track.tracks.length > 0 ? (
                        <Steps
                          orientation="vertical"
                          current={track.tracks.length - 1}
                          items={getLogisticsSteps().map((item) => ({
                            ...item,
                            status: item.status as 'wait' | 'process' | 'finish' | 'error',
                          }))}
                        />
                      ) : (
                        <div
                          style={{
                            fontSize: '14px',
                            color: '#999',
                            textAlign: 'center',
                            padding: '20px 0',
                          }}
                        >
                          暂无物流轨迹信息
                        </div>
                      )}
                    </div>

                    {/* 刷新按钮 */}
                    <div style={{ textAlign: 'center' }}>
                      <Button
                        icon={<LoadingOutlined spin={trackLoading} />}
                        onClick={loadTrackInfo}
                        loading={trackLoading}
                      >
                        刷新物流信息
                      </Button>
                    </div>
                  </>
                ) : (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '40px 0',
                      color: '#999',
                    }}
                  >
                    <CarOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                    <div>暂无物流信息</div>
                    <div style={{ fontSize: 12, marginTop: 8 }}>
                      订单可能还未发货或物流信息尚未录入
                    </div>
                  </div>
                )}
              </Space>
            ),
          },
        ]}
      />
    </Drawer>
  );
};

export default OrderDetailDrawer;
