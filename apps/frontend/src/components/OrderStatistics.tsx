import { Card, Row, Col, Statistic } from 'antd';
import {
  ShoppingOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import type { Order } from '../services/orderService';

interface OrderStatisticsProps {
  orders: Order[];
}

const OrderStatistics: React.FC<OrderStatisticsProps> = ({ orders }) => {
  // 统计数据
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.totprice, 0);
  const deliveredOrders = orders.filter(order => order.status === 'delivered').length;
  const pendingOrders = orders.filter(order => 
    order.status === 'pending' || order.status === 'paid'
  ).length;

  const statisticsData = [
    {
      title: '总订单数',
      value: totalOrders,
      icon: <ShoppingOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
      color: '#e6f7ff',
    },
    {
      title: '总销售额',
      value: totalRevenue,
      prefix: '¥',
      precision: 2,
      icon: <DollarOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
      color: '#f6ffed',
    },
    {
      title: '已完成',
      value: deliveredOrders,
      icon: <CheckCircleOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
      color: '#f6ffed',
    },
    {
      title: '待处理',
      value: pendingOrders,
      icon: <ClockCircleOutlined style={{ fontSize: 32, color: '#faad14' }} />,
      color: '#fffbe6',
    },
  ];

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      {statisticsData.map((stat, index) => (
        <Col xs={24} sm={12} lg={6} key={index}>
          <Card variant="filled" style={{ background: stat.color }}>
            <Statistic
              title={<span style={{ fontSize: 14, fontWeight: 500 }}>{stat.title}</span>}
              value={stat.value}
              prefix={stat.prefix}
              precision={stat.precision}
              styles={{ content: { fontSize: 24, fontWeight: 600 } }}
              suffix={stat.icon}
            />
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default OrderStatistics;
