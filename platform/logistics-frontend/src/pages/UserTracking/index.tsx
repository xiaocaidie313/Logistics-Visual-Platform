import React, { useEffect, useState, useRef } from 'react';
import { Result, Tag, Steps, Spin } from 'antd';
import { LoadingOutlined, CarOutlined } from '@ant-design/icons';
import { useAMap } from '../../components/MapCore/useAMap'; // 确保路径回退两层
import PathLine from '../../components/MapCore/PathLine';
import CarMarker from '../../components/MapCore/CarMarker';
import type { OrderData } from '../../types/api'; // 确保类型定义存在
import dayjs from 'dayjs';
import './styles.css';

const UserTracking: React.FC = () => {
    const { map, AMap } = useAMap('user-map-container');

    const [order, setOrder] = useState<OrderData | null>(null);
    const [currentPos, setCurrentPos] = useState<[number, number] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const wsRef = useRef<WebSocket | null>(null);
    const orderIdRef = useRef<string | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');

        if (!id) {
            setError('链接无效：缺少运单号参数 (例如 ?id=SF10028)');
            setLoading(false);
            return;
        }

        orderIdRef.current = id;
        fetchOrder(id);
        connectWebSocket(id);
        console.log("order:", order);
        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, []);

    const fetchOrder = async (id: string) => {
        try {
            const res = await fetch(`http://localhost:3003/api/tracks/${id}`);
            const result = await res.json();

            if (result.success && result.data) {
                const data: OrderData = result.data;
                setOrder(data);

                if (data.currentCoords) {
                    setCurrentPos(data.currentCoords as [number, number]);
                }

                setTimeout(() => {
                    if (map && AMap && data.path.length > 0) {
                        const polyline = new AMap.Polyline({ path: data.path });
                        map.setFitView([polyline]);
                    }
                }, 500);
            } else {
                setError('未找到该运单信息');
            }
        } catch (e) {
            setError('网络连接异常');
        } finally {
            setLoading(false);
        }
    };

    const connectWebSocket = (targetId: string) => {
        const ws = new WebSocket('ws://localhost:3003');
        wsRef.current = ws;

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.id !== targetId) return;

                if (data.type === 'LOCATION_UPDATE' && data.position) {
                    setCurrentPos(data.position as [number, number]);
                }

                if (data.type === 'STATUS_UPDATE' || data.type === 'LOG_UPDATE') {
                    fetchOrder(targetId);
                }
            } catch (e) {
                console.error(e);
            }
        };
    };

    if (error) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
                <Result status="404" title="查询失败" subTitle={error} />
            </div>
        );
    }

    return (
        <div className="user-tracking-page">
            <div id="user-map-container" className="map-bg" />

            {map && AMap && order && (
                <>
                    <PathLine
                        key={`path-${order.id}`}
                        map={map} AMap={AMap}
                        path={order.path as [number, number][]}
                        currentPosition={currentPos}
                    />
                    {currentPos && (
                        <CarMarker
                            key={`car-${order.id}`}
                            map={map} AMap={AMap}
                            position={currentPos}
                        />
                    )}
                </>
            )}

            <div className="floating-card">
                {loading ? (
                    <div className="loading-box">
                        <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                        <div style={{ marginTop: 10 }}>正在查询...</div>
                    </div>
                ) : order ? (
                    <>
                        <div className="card-header">
                            <div>
                                <div className="company-name">{order.logisticsCompany}</div>
                                <div className="logistics-num">{order.id}</div>
                            </div>
                            <Tag color={order.logisticsStatus === 'delivered' ? 'green' : 'processing'}>
                                {order.logisticsStatus === 'delivered' ? '已签收' : '运输中'}
                            </Tag>
                        </div>

                        <div className="route-info">
                            <div className="route-item">
                                <div className="dot start">发</div>
                                <div className="text">{order.sendAddress}</div>
                            </div>
                            <div className="route-item">
                                <div className="dot end">收</div>
                                <div className="text">{order.userAddress}</div>
                            </div>
                        </div>

                        <div className="timeline-box">
                            <Steps
                                direction="vertical"
                                size="small"
                                current={0}
                                items={order.tracks.slice().reverse().map((log, index) => ({
                                    title: <span style={{ fontSize: 14 }}>{log.status === 'delivered' ? '已签收' : '运输中'}</span>,
                                    description: (
                                        <div>
                                            <div style={{ color: index === 0 ? '#333' : '#999', marginTop: 4 }}>{log.description}</div>
                                            <div style={{ fontSize: 12, color: '#bbb', marginTop: 2 }}>{dayjs(log.time).format('MM-DD HH:mm')}</div>
                                        </div>
                                    ),
                                    icon: index === 0 ? <CarOutlined style={{ color: '#1677ff' }} /> : <div className="dot-gray" />
                                }))}
                            />
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    );
};

export default UserTracking;