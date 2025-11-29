import React, { useEffect, useState, useRef } from 'react';
import { Layout, Input, Card, Statistic, Row, Col, Tag, theme, message, Button, Space } from 'antd';
import ReactECharts from 'echarts-for-react';
import { useAMap } from '../../components/MapCore/useAMap';
import PathLine from '../../components/MapCore/PathLine';
import CarMarker from '../../components/MapCore/CarMarker';
import LogisticsTimeline from '../../components/Timeline';
import type { OrderData, ProvinceStat, TrackLog } from '../../types/api';
import './styles.css';

const { Sider, Content } = Layout;
const { Search } = Input;

const LogisticsTracking: React.FC = () => {
    const { map, AMap } = useAMap('map-container');
    const { token: { colorBgContainer } } = theme.useToken();

    const [order, setOrder] = useState<OrderData | null>(null);
    const [currentPos, setCurrentPos] = useState<[number, number] | null>(null);
    const [logs, setLogs] = useState<TrackLog[]>([]);
    const [chartData, setChartData] = useState<ProvinceStat[]>([]);
    const [loading, setLoading] = useState(false);
    const [wsStatus, setWsStatus] = useState<string>('未连接');

    const wsRef = useRef<WebSocket | null>(null);
    // 使用 Ref 记录当前正在查看的订单 ID
    // Ref 的值改变不会触发重渲染，但能保证在 WebSocket 回调中读到最新值
    const activeOrderIdRef = useRef<string | null>(null);

    useEffect(() => {
        fetchStats();
        const ws = new WebSocket('ws://localhost:3003');
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('前端 WebSocket 已连接');
            setWsStatus('实时监控中');
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                handleWsMessage(data);
            } catch (e) {
                console.error("WS 解析错误", e);
            }
        };

        ws.onclose = () => setWsStatus('连接断开');

        return () => {
            ws.close();
        };
    }, []);

    const handleWsMessage = (data: any) => {
        // WebSocket 消息过滤器
        // 如果收到的消息 ID 不等于当前正在查看的 ID，直接忽略！
        // 这样就彻底杜绝了“上一单的数据干扰这一单”的问题
        if (!data.id || data.id !== activeOrderIdRef.current) {
            return;
        }

        if (data.type === 'LOCATION_UPDATE') {
            if (data.position) {
                setCurrentPos(data.position as [number, number]);
            }
        }

        if (data.type === 'STATUS_UPDATE' || data.type === 'LOG_UPDATE') {
            // 重新拉取数据以同步状态
            fetchOrderDetails(data.id, false);

            if (data.status === 'delivered') {
                fetchStats();
            }
        }
    };

    const fetchStats = async () => {
        try {
            const res = await fetch('http://localhost:3003/api/stats/density');
            const data = await res.json();
            setChartData(data);
        } catch (e) {
            console.error("获取图表失败", e);
        }
    };

    const fetchOrderDetails = async (id: string, isSearchAction = false) => {
        if (!id) return;

        if (isSearchAction) {
            setLoading(true);
            // 清理旧状态
            setOrder(null);
            setCurrentPos(null);
            setLogs([]);

            // 更新当前活跃 ID
            activeOrderIdRef.current = id;
        }

        try {
            const res = await fetch(`http://localhost:3003/api/tracks/${id}`);
            const result = await res.json();

            if (result.success && result.data) {
                const data: OrderData = result.data;
                setOrder(data);
                setLogs(data.tracks);

                if (data.currentCoords) {
                    setCurrentPos(data.currentCoords as [number, number]);
                }

                if (isSearchAction) {
                    message.success(`查询成功: ${id}`);
                    setTimeout(() => {
                        if (map && AMap && data.path.length > 0) {
                            const polyline = new AMap.Polyline({ path: data.path });
                            map.setFitView([polyline]);
                        }
                    }, 500);
                }
            } else {
                if (isSearchAction) message.error('未找到该运单，请检查 ID 是否正确');
            }
        } catch (e) {
            console.error("详情获取失败", e);
            if (isSearchAction) message.error('查询出错，请检查后端服务');
        } finally {
            if (isSearchAction) setLoading(false);
        }
    };

    const handleSearch = (value: string) => {
        if (!value) {
            message.warning('请输入运单号');
            return;
        }
        fetchOrderDetails(value, true);
    };

    const handleCreateMockOrder = async () => {
        setLoading(true);
        const mockId = `SF${Math.floor(Math.random() * 10000)}`;

        // 创建时也立即更新活跃 ID
        activeOrderIdRef.current = mockId;

        const demoPayload = {
            id: mockId,
            orderId: `ORD-${Date.now()}`,
            logisticsCompany: "顺丰速运",
            logisticsNumber: mockId,
            orderTime: new Date(),
            sendAddress: "北京市海淀区",
            userAddress: Math.random() > 0.5 ? "广东省深圳市" : "上海市浦东新区"
        };

        try {
            const res = await fetch('http://localhost:3003/api/tracks/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(demoPayload)
            });
            const resData = await res.json();

            if (resData.success) {
                message.success(`测试订单创建成功！ID: ${mockId}`);
                fetchOrderDetails(mockId, true);
            } else {
                message.error(resData.message || '创建失败');
            }
        } catch (e) {
            message.error('创建请求失败');
        } finally {
            setLoading(false);
        }
    };

    const chartOption = {
        title: { text: '全国发货热力 (省份)', textStyle: { fontSize: 14 } },
        tooltip: { trigger: 'item' },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
            type: 'category',
            data: chartData.map(i => i.name),
            axisLabel: { interval: 0, rotate: 30 }
        },
        yAxis: { type: 'value' },
        series: [{
            name: '订单量',
            type: 'bar',
            data: chartData.map(i => i.value),
            itemStyle: { color: '#1677ff' },
            barWidth: '60%'
        }]
    };

    return (
        <Layout style={{ height: '100vh' }}>
            <Sider width={400} style={{ background: colorBgContainer, padding: '16px', zIndex: 2, boxShadow: '2px 0 8px rgba(0,0,0,0.1)', overflowY: 'auto' }}>
                <div style={{ marginBottom: 16 }}>
                    <h3>📦 物流可视化控制台</h3>
                    <p style={{ color: wsStatus === '实时监控中' ? 'green' : 'red', fontSize: 12 }}>
                        ● System: {wsStatus}
                    </p>

                    <Space direction="vertical" style={{ width: '100%' }}>
                        <Search
                            placeholder="请输入运单号 (例如 SF10027)"
                            enterButton="查询"
                            size="large"
                            loading={loading}
                            onSearch={handleSearch}
                        />

                        <div style={{ textAlign: 'center', marginTop: 8 }}>
                            <span style={{ fontSize: 12, color: '#999', marginRight: 8 }}>数据库没数据？</span>
                            <Button size="small" type="dashed" onClick={handleCreateMockOrder}>
                                + 生成一条测试订单
                            </Button>
                        </div>
                    </Space>
                </div>

                {order ? (
                    <>
                        <Card size="small" title="当前运单" extra={<Tag color={order.logisticsStatus === 'delivered' ? 'green' : 'processing'}>{order.logisticsStatus}</Tag>}>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Statistic
                                        title="运单号"
                                        value={order.id}
                                        valueStyle={{ fontSize: 16 }}
                                    />
                                </Col>
                                <Col span={12}>
                                    <Statistic
                                        title="目的地"
                                        value={order.userAddress}
                                        valueStyle={{ fontSize: 14 }}
                                        formatter={(val) => <span style={{ fontSize: 14 }}>{val}</span>}
                                    />
                                </Col>
                            </Row>
                        </Card>

                        <LogisticsTimeline logs={logs} />
                    </>
                ) : (
                    <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>
                        请输入运单号进行查询<br />
                        或点击上方按钮生成测试数据
                    </div>
                )}

                <div style={{ marginTop: 20, height: 250 }}>
                    <ReactECharts option={chartOption} style={{ height: '100%', width: '100%' }} />
                </div>
            </Sider>

            <Content style={{ position: 'relative' }}>
                <div id="map-container" style={{ width: '100%', height: '100%' }} />

                {map && AMap && order && (
                    <>
                        <PathLine
                            key={`path-${order.id}`}
                            map={map}
                            AMap={AMap}
                            path={order.path as [number, number][]}
                            currentPosition={currentPos}
                        />

                        {currentPos && (
                            <CarMarker
                                key={`car-${order.id}`}
                                map={map}
                                AMap={AMap}
                                position={currentPos}
                            />
                        )}
                    </>
                )}
            </Content>
        </Layout>
    );
};

export default LogisticsTracking;