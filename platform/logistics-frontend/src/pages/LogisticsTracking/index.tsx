import React, { useEffect, useState } from 'react';
import { Layout, Input, Card, Statistic, Row, Col, Tag, theme } from 'antd';
import ReactECharts from 'echarts-for-react';
import { useAMap } from '../../components/MapCore/useAMap';
import PathLine from '../../components/MapCore/PathLine';
import CarMarker from '../../components/MapCore/CarMarker';
import LogisticsTimeline from '../../components/Timeline';
import './styles.css';

const { Sider, Content } = Layout;
const { Search } = Input;

// 模拟的静态数据，防止没连后端时报错
const MOCK_PATH: [number, number][] = [
    [116.397428, 39.90923], [116.410, 39.915], [116.420, 39.920], [116.450, 39.950]
];

const LogisticsTracking: React.FC = () => {
    const { map, AMap } = useAMap('map-container');
    const [currentPos, setCurrentPos] = useState<[number, number]>(MOCK_PATH[0]);

    // Ant Design 样式 hook
    const { token: { colorBgContainer } } = theme.useToken();

    // 模拟 WebSocket 接收数据 (如果你还没有启动后端，这个 Effect 会模拟小车跑)
    useEffect(() => {
        let index = 0;
        const timer = setInterval(() => {
            // 循环在 Mock 路径上跑，演示效果
            if (index < MOCK_PATH.length) {
                setCurrentPos(MOCK_PATH[index]);
                index++;
            } else {
                index = 0; // 循环演示
            }
        }, 2000);
        return () => clearInterval(timer);
    }, []);

    // ECharts 配置
    const chartOption = {
        title: { text: '区域订单密度', textStyle: { fontSize: 14 } },
        tooltip: {},
        xAxis: { data: ["朝阳", "海淀", "西城", "东城", "丰台"] },
        yAxis: {},
        series: [{ name: '单量', type: 'bar', data: [120, 200, 150, 80, 70], itemStyle: { color: '#1677ff' } }]
    };

    return (
        <Layout style={{ height: '100vh' }}>
            <Sider width={380} style={{ background: colorBgContainer, padding: '16px', zIndex: 2, boxShadow: '2px 0 8px rgba(0,0,0,0.1)' }}>
                <div style={{ marginBottom: 16 }}>
                    <Search placeholder="请输入运单号" enterButton="查询" size="large" />
                </div>

                <Card size="small" title="当前状态" extra={<Tag color="processing">运输中</Tag>}>
                    <Row gutter={16}>
                        <Col span={12}><Statistic title="预计送达" value="14:30" /></Col>
                        <Col span={12}><Statistic title="剩余里程" value="5.2 km" /></Col>
                    </Row>
                </Card>

                <div style={{ marginTop: 20, height: 200 }}>
                    <ReactECharts option={chartOption} style={{ height: '100%', width: '100%' }} />
                </div>

                <LogisticsTimeline
                    items={[
                        { status: '运输中', desc: '包裹正在前往朝阳集散中心', time: '10:30', active: true },
                        { status: '已揽收', desc: '顺丰快递员已揽收', time: '09:00' },
                        { status: '已发货', desc: '商家已发货', time: '08:30' },
                    ]}
                />
            </Sider>

            <Content style={{ position: 'relative' }}>
                <div id="map-container" style={{ width: '100%', height: '100%' }} />
                {map && AMap && (
                    <>
                        <PathLine map={map} AMap={AMap} path={MOCK_PATH} />
                        {currentPos && <CarMarker map={map} AMap={AMap} position={currentPos} />}
                    </>
                )}
            </Content>
        </Layout>
    );
};

export default LogisticsTracking;