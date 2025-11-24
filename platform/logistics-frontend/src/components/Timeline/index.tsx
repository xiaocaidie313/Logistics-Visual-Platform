import React from 'react';
import { Timeline as AntTimeline, Card } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';

interface LogisticsTimelineProps {
    items: {
        status: string;
        desc: string;
        time: string;
        active?: boolean;
    }[];
}

const LogisticsTimeline: React.FC<LogisticsTimelineProps> = ({ items }) => {
    return (
        <Card title="物流详情" size="small" style={{ marginTop: 20 }}>
            <AntTimeline
                mode="left"
                items={items.map(item => ({
                    color: item.active ? 'blue' : 'gray',
                    dot: item.active ? <ClockCircleOutlined style={{ fontSize: '16px' }} /> : undefined,
                    children: (
                        <>
                            <div style={{ fontWeight: 'bold' }}>{item.status}</div>
                            <div>{item.desc}</div>
                            <div style={{ fontSize: '12px', color: '#999' }}>{item.time}</div>
                        </>
                    ),
                }))}
            />
        </Card>
    );
};

export default LogisticsTimeline;