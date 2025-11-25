import React from 'react';
import { Timeline as AntTimeline, Card, Tag } from 'antd';
import { ClockCircleOutlined, CheckCircleOutlined, CarOutlined } from '@ant-design/icons';
// 改动 1: 添加 'type' 关键字
import type { TrackLog } from '../../types/api';
import dayjs from 'dayjs';

interface LogisticsTimelineProps {
    logs: TrackLog[];
}

const LogisticsTimeline: React.FC<LogisticsTimelineProps> = ({ logs }) => {
    // 倒序排列，最新的在最上面
    const sortedLogs = [...logs].reverse();

    return (
        <Card title="物流详情" size="small" style={{ marginTop: 20, maxHeight: '400px', overflowY: 'auto' }}>
            <AntTimeline
                mode="left"
                items={sortedLogs.map((log, index) => {
                    const isLatest = index === 0;

                    // 改动 2: 设置 ClockCircleOutlined 为默认图标
                    let color = 'gray';
                    let icon = <ClockCircleOutlined />; // 默认状态使用时钟图标

                    if (log.status === 'delivered') {
                        color = 'green';
                        icon = <CheckCircleOutlined />;
                    } else if (log.status === 'shipping' || log.status === 'shipped') {
                        color = 'blue';
                        icon = <CarOutlined />;
                    }
                    // 其他状态 (如 pending) 将保留默认的 color='gray' 和 icon=<ClockCircleOutlined />

                    return {
                        color: color,
                        dot: icon,
                        children: (
                            <>
                                <div style={{ fontWeight: isLatest ? 'bold' : 'normal', color: isLatest ? '#1677ff' : 'inherit' }}>
                                    {log.status === 'delivered' ? <Tag color="success">已签收</Tag> : null}
                                    {log.description}
                                </div>
                                <div style={{ fontSize: '12px', color: '#999', marginTop: 4 }}>
                                    {dayjs(log.time).format('MM-DD HH:mm:ss')}
                                </div>
                                <div style={{ fontSize: '12px', color: '#666' }}>
                                    📍 {log.location}
                                </div>
                            </>
                        ),
                    };
                })}
            />
        </Card>
    );
};

export default LogisticsTimeline;