import { Drawer, Descriptions, Image, Tag, Space, Timeline, Divider } from 'antd';
import { ClockCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';
import type { Order, OrderStatus } from '../services/orderService';
import dayjs from 'dayjs';

interface OrderDetailDrawerProps {
  open: boolean;
  order: Order | null;
  onClose: () => void;
}

const OrderDetailDrawer: React.FC<OrderDetailDrawerProps> = ({ open, order, onClose }) => {
  if (!order) return null;

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
    const items = [
      {
        children: (
          <>
            <div><strong>订单创建</strong></div>
            <div style={{ color: '#888', fontSize: 12 }}>
              {dayjs(order.ordertime).format('YYYY-MM-DD HH:mm:ss')}
            </div>
          </>
        ),
        color: 'gray',
      },
    ];

    if (order.status !== 'pending') {
      items.push({
        children: (
          <>
            <div><strong>订单支付</strong></div>
            <div style={{ color: '#888', fontSize: 12 }}>订单已支付</div>
          </>
        ),
        color: 'blue',
      });
    }

    if (order.status === 'shipped' || order.status === 'confirmed' || order.status === 'delivered') {
      items.push({
        children: (
          <>
            <div><strong>订单发货</strong></div>
            <div style={{ color: '#888', fontSize: 12 }}>
              {dayjs(order.sendtime).format('YYYY-MM-DD HH:mm:ss')}
            </div>
          </>
        ),
        color: 'blue',
      });
    }

    if (order.status === 'delivered') {
      items.push({
        children: (
          <>
            <div><strong>订单送达</strong></div>
            <div style={{ color: '#888', fontSize: 12 }}>
              {dayjs(order.arrivetime).format('YYYY-MM-DD HH:mm:ss')}
            </div>
          </>
        ),
        color: 'green',
      });
    }

    if (order.status === 'cancelled') {
      items.push({
        children: (
          <>
            <div><strong>订单取消</strong></div>
            <div style={{ color: '#888', fontSize: 12 }}>订单已取消</div>
          </>
        ),
        color: 'red',
      });
    }

    if (order.status === 'refunded') {
      items.push({
        children: (
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

  return (
    <Drawer
      title={`订单详情 - ${order.orderId}`}
      placement="right"
      width={600}
      onClose={onClose}
      open={open}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 订单状态 */}
        <div>
          <Tag color={statusConfig[order.status].color} style={{ fontSize: 16, padding: '4px 16px' }}>
            {statusConfig[order.status].text}
          </Tag>
        </div>

        {/* 商品信息 */}
        <div>
          <Divider orientation="left">商品信息</Divider>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Image
              src={order.images}
              alt={order.skuname}
              style={{ width: '100%', maxHeight: 300, objectFit: 'cover' }}
              fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3PTWBSGcbGzM6GCKqlIBRV0dHRJFarQ0eUT8LH4BnRU0NHR0UEFVdIlFRV7TzRksomPY8uykTk/zewQfKw/9znv4yvJynLv4uLiV2dBoDiBf4qP3/ARuCRABEFAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghgg0Aj8i0JO4OzsrPv69Wv+hi2qPHr0qNvf39+iI97soRIh4f3z58/u7du3SXX7Xt7Z2enevHmzfQe+oSN2apSAPj09TSrb+XKI/f379+08+A0cNRE2ANkupk+ACNPvkSPcAAEibACyXUyfABGm3yNHuAECRNgAZLuYPgEirKlHu7u7XdyytGwHAd8jjNyng4OD7vnz51dbPT8/7z58+NB9+/bt6jU/TI+AGWHEnrx48eJ/EsSmHzx40L18+fLyzxF3ZVMjEyDCiEDjMYZZS5wiPXnyZFbJaxMhQIQRGzHvWR7XCyOCXsOmiDAi1HmPMMQjDpbpEiDCiL358eNHurW/5SnWdIBbXiDCiA38/Pnzrce2YyZ4//59F3ePLNMl4PbpiL2J0L979+7yDtHDhw8vtzzvdGnEXdvUigSIsCLAWavHp/+qM0BcXMd/q25n1vF57TYBp0a3mUzilePj4+7k5KSLb6gt6ydAhPUzXnoPR0dHl79WGTNCfBnn1uvSCJdegQhLI1vvCk+fPu2ePXt2tZOYEV6/fn31dz+shwAR1sP1cqvLntbEN9MxA9xcYjsxS1jWR4AIa2Ibzx0tc44fYX/16lV6NDFLXH+YL32jwiACRBiEbf5KcXoTIsQSpzXx4N28Ja4BQoK7rgXiydbHjx/P25TaQAJEGAguWy0+2Q8PD6/Ki4R8EVl+bzBOnZY95fq9rj9zAkTI2SxdidBHqG9+skdw43borCXO/ZcJdraPWdv22uIEiLA4q7nvvCug8WTqzQveOH26fodo7g6uFe/a17W3+nFBAkRYENRdb1vkkz1CH9cPsVy/jrhr27PqMYvENYNlHAIesRiBYwRy0V+8iXP8+/fvX11Mr7L7ECueb/r48eMqm7FuI2BGWDEG8cm+7G3NEOfmdcTQw4h9/55lhm7DekRYKQPZF2ArbXTAyu4kDYB2YxUzwg0gi/41ztHnfQG26HbGel/crVrm7tNY+/1btkOEAZ2M05r4FB7r9GbAIdxaZYrHdOsgJ/wCEQY0J74TmOKnbxxT9n3FgGGWWsVdowHtjt9Nnvf7yQM2aZU/TIAIAxrw6dOnAWtZZcoEnBpNuTuObWMEiLAx1HY0ZQJEmHJ3HNvGCBBhY6jtaMoEiJB0Z29vL6ls58vxPcO8/zfrdo5qvKO+d3Fx8Wu8zf1dW4p/cPzLly/dtv9Ts/EbcvGAHhHyfBIhZ6NSiIBTo0LNNtScABFyNiqFCBChULMNNSdAhJyNSiECRCjUbEPNCRAhZ6NSiAARCjXbUHMCRMjZqBQiQIRCzTbUnAARcjYqhQgQoVCzDTUnQIScjUohAkQo1GxDzQkQIWejUogAEQo121BzAkTI2agUIkCEQs021JwAEXI2KoUIEKFQsw01J0CEnI1KIQJEKNRsQ80JECFno1KIABEKNdtQcwJEyNmoFCJAhELNNtScABFyNiqFCBChULMNNSdAhJyNSiECRCjUbEPNCRAhZ6NSiAARCjXbUHMCRMjZqBQiQIRCzTbUnAARcjYqhQgQoVCzDTUnQIScjUohAkQo1GxDzQkQIWejUogAEQo121BzAkTI2agUIkCEQs021JwAEXI2KoUIEKFQsw01J0CEnI1KIQJEKNRsQ80JECFno1KIABEKNdtQcwJEyNmoFCJAhELNNtScABFyNiqFCBChULMNNSdAhJyNSiECRCjUbEPNCRAhZ6NSiAARCjXbUHMCRMjZqBQiQIRCzTbUnAARcjYqhQgQoVCzDTUnQIScjUohAkQo1GxDzQkQIWejUogAEQo121BzAkTI2agUIkCEQs021JwAEXI2KoUIEKFQsw01J0CEnI1KIQJEKNRsQ80JECFno1KIABEKNdtQcwJEyNmoFCJAhELNNtScABFyNiqFCBChULMNNSdAhJyNSiEC/wGgKKC4YMA4TAAAAABJRU5ErkJggg=="
            />
            <Descriptions column={1} size="small">
              <Descriptions.Item label="商品名称">{order.skuname}</Descriptions.Item>
              <Descriptions.Item label="单价">¥{order.price.toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="数量">{order.amount}</Descriptions.Item>
              <Descriptions.Item label="总价">
                <span style={{ color: '#ff4d4f', fontSize: 16, fontWeight: 600 }}>
                  ¥{order.totprice.toFixed(2)}
                </span>
              </Descriptions.Item>
            </Descriptions>
          </Space>
        </div>

        {/* 收发货地址 */}
        <div>
          <Divider orientation="left">物流信息</Divider>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <div style={{ marginBottom: 8 }}>
                <EnvironmentOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                <strong>发货地址</strong>
              </div>
              <div style={{ paddingLeft: 24, color: '#666' }}>{order.sendaddress}</div>
            </div>
            <div>
              <div style={{ marginBottom: 8 }}>
                <EnvironmentOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                <strong>收货地址</strong>
              </div>
              <div style={{ paddingLeft: 24, color: '#666' }}>{order.useraddress}</div>
            </div>
          </Space>
        </div>

        {/* 订单时间线 */}
        <div>
          <Divider orientation="left">订单进度</Divider>
          <Timeline items={getTimelineItems()} />
        </div>

        {/* 订单信息 */}
        <div>
          <Divider orientation="left">订单信息</Divider>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="订单ID">{order.id}</Descriptions.Item>
            <Descriptions.Item label="订单编号">{order.orderId}</Descriptions.Item>
            <Descriptions.Item label="下单时间">
              {dayjs(order.ordertime).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            {order.sendtime && (
              <Descriptions.Item label="发货时间">
                {dayjs(order.sendtime).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            )}
            {order.arrivetime && (
              <Descriptions.Item label="送达时间">
                {dayjs(order.arrivetime).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            )}
          </Descriptions>
        </div>
      </Space>
    </Drawer>
  );
};

export default OrderDetailDrawer;
