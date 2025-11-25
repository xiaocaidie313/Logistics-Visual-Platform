import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  message,
  Input,
  Card,
  Tag,
  Select,
  Dropdown,
  Image,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  FilterOutlined,
  SortAscendingOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import OrderFormModal from '../components/OrderFormModal';
import OrderDetailDrawer from '../components/OrderDetailDrawer';
import OrderStatistics from '../components/OrderStatistics';
import type { Order, OrderStatus } from '../services/orderService';
import {
  getOrderList,
  createOrder,
  updateOrder,
  deleteOrder,
  updateOrderStatus,
  getOrdersByStatus,
} from '../services/orderService';
import dayjs from 'dayjs';

const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedOrder, setSelectedOrder] = useState<Order | undefined>();
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');

  const statusConfig: Record<OrderStatus, { color: string; text: string }> = {
    pending: { color: 'default', text: '待支付' },
    paid: { color: 'processing', text: '已支付' },
    shipped: { color: 'blue', text: '已发货' },
    confirmed: { color: 'cyan', text: '已确认' },
    delivered: { color: 'success', text: '已送达' },
    cancelled: { color: 'error', text: '已取消' },
    refunded: { color: 'warning', text: '已退款' },
  };

  // 加载订单列表
  const loadOrders = async (status?: OrderStatus) => {
    setLoading(true);
    try {
      const response = status && status !== 'all'
        ? await getOrdersByStatus(status)
        : await getOrderList();
      
      if (response.code === 200) {
        setOrders(response.data);
      } else {
        message.error(response.message || '获取订单列表失败');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '获取订单列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // 处理状态筛选
  const handleStatusFilter = (status: OrderStatus | 'all') => {
    setStatusFilter(status);
    if (status === 'all') {
      loadOrders();
    } else {
      loadOrders(status);
    }
  };

  // 打开创建订单模态框
  const handleCreate = () => {
    setModalMode('create');
    setSelectedOrder(undefined);
    setModalOpen(true);
  };

  // 打开编辑订单模态框
  const handleEdit = (record: Order) => {
    setModalMode('edit');
    setSelectedOrder(record);
    setModalOpen(true);
  };

  // 查看订单详情
  const handleViewDetail = (record: Order) => {
    setDetailOrder(record);
    setDrawerOpen(true);
  };

  // 删除订单
  const handleDelete = (record: Order) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除订单 "${record.orderId}" 吗?`,
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await deleteOrder(record._id!);
          if (response.code === 200) {
            message.success('删除订单成功');
            loadOrders(statusFilter === 'all' ? undefined : statusFilter);
          } else {
            message.error(response.message || '删除订单失败');
          }
        } catch (error: any) {
          message.error(error.response?.data?.message || '删除订单失败');
        }
      },
    });
  };

  // 更改订单状态
  const handleUpdateStatus = async (record: Order, newStatus: OrderStatus) => {
    try {
      const response = await updateOrderStatus(record._id!, newStatus);
      if (response.code === 200) {
        message.success('状态更新成功');
        loadOrders(statusFilter === 'all' ? undefined : statusFilter);
      } else {
        message.error(response.message || '状态更新失败');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '状态更新失败');
    }
  };

  // 提交表单
  const handleSubmit = async (values: Omit<Order, '_id'>) => {
    if (modalMode === 'create') {
      await createOrder(values);
    } else {
      await updateOrder(selectedOrder!._id!, values);
    }
    loadOrders(statusFilter === 'all' ? undefined : statusFilter);
  };

  // 操作菜单
  const getActionMenu = (record: Order): MenuProps => ({
    items: [
      {
        key: 'view',
        icon: <EyeOutlined />,
        label: '查看详情',
        onClick: () => handleViewDetail(record),
      },
      {
        key: 'edit',
        icon: <EditOutlined />,
        label: '编辑',
        onClick: () => handleEdit(record),
      },
      {
        type: 'divider',
      },
      {
        key: 'status',
        label: '更改状态',
        children: Object.entries(statusConfig).map(([key, value]) => ({
          key: `status-${key}`,
          label: value.text,
          disabled: record.status === key,
          onClick: () => handleUpdateStatus(record, key as OrderStatus),
        })),
      },
      {
        type: 'divider',
      },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: '删除',
        danger: true,
        onClick: () => handleDelete(record),
      },
    ],
  });

  // 表格列定义
  const columns: ColumnsType<Order> = [
    {
      title: '序号',
      key: 'index',
      width: 70,
      align: 'center',
      render: (_, __, index) => {
        const { current = 1, pageSize = 10 } = pagination;
        return (current - 1) * pageSize + index + 1;
      },
    },
    {
      title: '商品图片',
      dataIndex: 'images',
      key: 'images',
      width: 100,
      render: (text, record) => (
        <Image
          src={text}
          alt={record.skuname}
          width={60}
          height={60}
          style={{ objectFit: 'cover', borderRadius: 4 }}
          fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3PTWBSGcbGzM6GCKqlIBRV0dHRJFarQ0eUT8LH4BnRU0NHR0UEFVdIlFRV7TzRksomPY8uykTk/zewQfKw/9znv4yvJynLv4uLiV2dBoDiBf4qP3/ARuCRABEFAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghgg0Aj8i0JO4OzsrPv69Wv+hi2qPHr0qNvf39+iI97soRIh4f3z58/u7du3SXX7Xt7Z2enevHmzfQe+oSN2apSAPj09TSrb+XKI/f379+08+A0cNRE2ANkupk+ACNPvkSPcAAEibACyXUyfABGm3yNHuAECRNgAZLuYPgEirKlHu7u7XdyytGwHAd8jjNyng4OD7vnz51dbPT8/7z58+NB9+/bt6jU/TI+AGWHEnrx48eJ/EsSmHzx40L18+fLyzxF3ZVMjEyDCiEDjMYZZS5wiPXnyZFbJaxMhQIQRGzHvWR7XCyOCXsOmiDAi1HmPMMQjDpbpEiDCiL358eNHurW/5SnWdIBbXiDCiA38/Pnzrce2YyZ4//59F3ePLNMl4PbpiL2J0L979+7yDtHDhw8vtzzvdGnEXdvUigSIsCLAWavHp/+qM0BcXMd/q25n1vF57TYBp0a3mUzilePj4+7k5KSLb6gt6ydAhPUzXnoPR0dHl79WGTNCfBnn1uvSCJdegQhLI1vvCk+fPu2ePXt2tZOYEV6/fn31dz+shwAR1sP1cqvLntbEN9MxA9xcYjsxS1jWR4AIa2Ibzx0tc44fYX/16lV6NDFLXH+YL32jwiACRBiEbf5KcXoTIsQSpzXx4N28Ja4BQoK7rgXiydbHjx/P25TaQAJEGAguWy0+2Q8PD6/Ki4R8EVl+bzBOnZY95fq9rj9zAkTI2SxdidBHqG9+skdw43borCXO/ZcJdraPWdv22uIEiLA4q7nvvCug8WTqzQveOH26fodo7g6uFe/a17W3+nFBAkRYENRdb1vkkz1CH9cPsVy/jrhr27PqMYvENYNlHAIesRiBYwRy0V+8iXP8+/fvX11Mr7L7ECueb/r48eMqm7FuI2BGWDEG8cm+7G3NEOfmdcTQw4h9/55lhm7DekRYKQPZF2ArbXTAyu4kDYB2YxUzwg0gi/41ztHnfQG26HbGel/crVrm7tNY+/1btkOEAZ2M05r4FB7r9GbAIdxaZYrHdOsgJ/wCEQY0J74TmOKnbxxT9n3FgGGWWsVdowHtjt9Nnvf7yQM2aZU/TIAIAxrw6dOnAWtZZcoEnBpNuTuObWMEiLAx1HY0ZQJEmHJ3HNvGCBBhY6jtaMoEiJB0Z29vL6ls58vxPcO8/zfrdo5qvKO+d3Fx8Wu8zf1dW4p/cPzLly/dtv9Ts/EbcvGAHhHyfBIhZ6NSiIBTo0LNNtScABFyNiqFCBChULMNNSdAhJyNSiECRCjUbEPNCRAhZ6NSiAARCjXbUHMCRMjZqBQiQIRCzTbUnAARcjYqhQgQoVCzDTUnQIScjUohAkQo1GxDzQkQIWejUogAEQo121BzAkTI2agUIkCEQs021JwAEXI2KoUIEKFQsw01J0CEnI1KIQJEKNRsQ80JECFno1KIABEKNdtQcwJEyNmoFCJAhELNNtScABFyNiqFCBChULMNNSdAhJyNSiECRCjUbEPNCRAhZ6NSiAARCjXbUHMCRMjZqBQiQIRCzTbUnAARcjYqhQgQoVCzDTUnQIScjUohAkQo1GxDzQkQIWejUogAEQo121BzAkTI2agUIkCEQs021JwAEXI2KoUIEKFQsw01J0CEnI1KIQJEKNRsQ80JECFno1KIABEKNdtQcwJEyNmoFCJAhELNNtScABFyNiqFCBChULMNNSdAhJyNSiECRCjUbEPNCRAhZ6NSiAARCjXbUHMCRMjZqBQiQIRCzTbUnAARcjYqhQgQoVCzDTUnQIScjUohAkQo1GxDzQkQIWejUogAEQo121BzAkTI2agUIkCEQs021JwAEXI2KoUIEKFQsw01J0CEnI1KIQJEKNRsQ80JECFno1KIABEKNdtQcwJEyNmoFCJAhELNNtScABFyNiqFCBChULMNNSdAhJyNSiEC/wGgKKC4YMA4TAAAAABJRU5ErkJggg=="
        />
      ),
    },
    {
      title: '订单编号',
      dataIndex: 'orderId',
      key: 'orderId',
      width: 160,
      render: (text) => <span style={{ fontFamily: 'monospace' }}>{text}</span>,
    },
    {
      title: '商品名称',
      dataIndex: 'skuname',
      key: 'skuname',
      width: 200,
      ellipsis: true,
    },
    {
      title: '订单金额',
      dataIndex: 'totprice',
      key: 'totprice',
      width: 120,
      align: 'right',
      render: (price) => <span style={{ color: '#ff4d4f', fontWeight: 600 }}>¥{price.toFixed(2)}</span>,
      sorter: (a, b) => a.totprice - b.totprice,
    },
    {
      title: '数量',
      dataIndex: 'amount',
      key: 'amount',
      width: 80,
      align: 'center',
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: OrderStatus) => (
        <Tag color={statusConfig[status].color}>{statusConfig[status].text}</Tag>
      ),
    },
    {
      title: '下单时间',
      dataIndex: 'ordertime',
      key: 'ordertime',
      width: 180,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm'),
      sorter: (a, b) => dayjs(a.ordertime).unix() - dayjs(b.ordertime).unix(),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          <Dropdown menu={getActionMenu(record)} trigger={['click']}>
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  // 过滤订单数据
  const filteredOrders = orders.filter(order =>
    order.skuname?.toLowerCase().includes(searchText.toLowerCase()) ||
    order.orderId?.toLowerCase().includes(searchText.toLowerCase()) ||
    order.useraddress?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      {/* 统计卡片 */}
      <OrderStatistics orders={orders} />

      {/* 订单列表 */}
      <Card
        title={
          <Space>
            <span style={{ fontSize: '18px', fontWeight: 600 }}>订单列表</span>
            <Tag color="blue">{filteredOrders.length} 个订单</Tag>
          </Space>
        }
        extra={
          <Space>
            <Select
              value={statusFilter}
              onChange={handleStatusFilter}
              style={{ width: 120 }}
              options={[
                { value: 'all', label: '全部状态' },
                ...Object.entries(statusConfig).map(([key, value]) => ({
                  value: key,
                  label: value.text,
                })),
              ]}
            />
            <Input
              placeholder="搜索订单编号、商品名称"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 240 }}
              allowClear
            />
            <Button icon={<ReloadOutlined />} onClick={() => loadOrders(statusFilter === 'all' ? undefined : statusFilter)}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              创建订单
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredOrders}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            pageSizeOptions: ['10', '20', '50', '100'],
            onChange: (page, pageSize) => {
              setPagination({ current: page, pageSize });
            },
          }}
          scroll={{ x: 1400 }}
        />
      </Card>

      {/* 订单表单模态框 */}
      <OrderFormModal
        open={modalOpen}
        mode={modalMode}
        initialValues={selectedOrder}
        onCancel={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false);
        }}
        onSubmit={handleSubmit}
      />

      {/* 订单详情抽屉 */}
      <OrderDetailDrawer
        open={drawerOpen}
        order={detailOrder}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
};

export default OrderManagement;
