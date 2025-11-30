import { useState, useEffect } from 'react';
import {
    Table,
    Button,
    Space,
    Tag,
    message,
    Popconfirm,
    Input,
    Select,
    Card,
    Tooltip,
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SettingOutlined,
    SearchOutlined,
} from '@ant-design/icons';
import MerchantFormModal from '../components/MerchantFormModal';
import DeliveryRangeModal from '../components/DeliveryRangeModal';
import {
    getMerchantList,
    createMerchant,
    updateMerchant,
    updateMerchantDeliveryRange,
    updateMerchantStatus,
    deleteMerchant,
    Merchant,
    DeliveryMethods,
} from '../services/merchantService';

const { Option } = Select;

const MerchantManagement: React.FC = () => {
    const [merchants, setMerchants] = useState<Merchant[]>([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });

    // 搜索和筛选
    const [keyword, setKeyword] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');

    // 模态框状态
    const [formModalVisible, setFormModalVisible] = useState(false);
    const [deliveryModalVisible, setDeliveryModalVisible] = useState(false);
    const [currentMerchant, setCurrentMerchant] = useState<Merchant | null>(null);
    const [modalTitle, setModalTitle] = useState('');

    // 获取商家列表
    const fetchMerchants = async (page = 1, pageSize = 10) => {
        setLoading(true);
        try {
            const response = await getMerchantList({
                page,
                pageSize,
                keyword: keyword || undefined,
                status: statusFilter || undefined,
            });

            if (response.code === 200) {
                setMerchants(response.data.merchants);
                setPagination({
                    current: response.data.pagination.page,
                    pageSize: response.data.pagination.pageSize,
                    total: response.data.pagination.total,
                });
            } else {
                message.error(response.message || '获取商家列表失败');
            }
        } catch (error) {
            console.error('获取商家列表失败:', error);
            message.error('获取商家列表失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMerchants();
    }, []);

    // 处理搜索
    const handleSearch = () => {
        fetchMerchants(1, pagination.pageSize);
    };

    // 处理分页变化
    const handleTableChange = (newPagination: any) => {
        fetchMerchants(newPagination.current, newPagination.pageSize);
    };

    // 打开新建商家模态框
    const handleAdd = () => {
        setCurrentMerchant(null);
        setModalTitle('新建商家');
        setFormModalVisible(true);
    };

    // 打开编辑商家模态框
    const handleEdit = (merchant: Merchant) => {
        setCurrentMerchant(merchant);
        setModalTitle('编辑商家');
        setFormModalVisible(true);
    };

    // 打开配送范围配置模态框
    const handleConfigDelivery = (merchant: Merchant) => {
        setCurrentMerchant(merchant);
        setDeliveryModalVisible(true);
    };

    // 提交商家表单
    const handleFormSubmit = async (values: any) => {
        try {
            if (currentMerchant?._id) {
                // 更新
                const response = await updateMerchant(currentMerchant._id, values);
                if (response.code === 200) {
                    message.success('商家信息更新成功');
                    setFormModalVisible(false);
                    fetchMerchants(pagination.current, pagination.pageSize);
                } else {
                    message.error(response.message || '更新失败');
                }
            } else {
                // 创建
                const response = await createMerchant(values);
                if (response.code === 200) {
                    message.success('商家创建成功');
                    setFormModalVisible(false);
                    fetchMerchants(1, pagination.pageSize);
                } else {
                    message.error(response.message || '创建失败');
                }
            }
        } catch (error: any) {
            console.error('操作失败:', error);
            message.error(error.response?.data?.message || '操作失败');
        }
    };

    // 提交配送范围配置
    const handleDeliverySubmit = async (deliveryMethods: DeliveryMethods) => {
        if (!currentMerchant?._id) return;

        try {
            const response = await updateMerchantDeliveryRange(currentMerchant._id, deliveryMethods);
            if (response.code === 200) {
                message.success('配送范围更新成功');
                setDeliveryModalVisible(false);
                fetchMerchants(pagination.current, pagination.pageSize);
            } else {
                message.error(response.message || '更新失败');
            }
        } catch (error: any) {
            console.error('更新配送范围失败:', error);
            message.error(error.response?.data?.message || '更新失败');
        }
    };

    // 更改商家状态
    const handleStatusChange = async (merchantId: string, status: 'active' | 'inactive' | 'suspended') => {
        try {
            const response = await updateMerchantStatus(merchantId, status);
            if (response.code === 200) {
                message.success('状态更新成功');
                fetchMerchants(pagination.current, pagination.pageSize);
            } else {
                message.error(response.message || '状态更新失败');
            }
        } catch (error) {
            console.error('状态更新失败:', error);
            message.error('状态更新失败');
        }
    };

    // 删除商家
    const handleDelete = async (merchantId: string) => {
        try {
            const response = await deleteMerchant(merchantId);
            if (response.code === 200) {
                message.success('商家删除成功');
                fetchMerchants(pagination.current, pagination.pageSize);
            } else {
                message.error(response.message || '删除失败');
            }
        } catch (error) {
            console.error('删除失败:', error);
            message.error('删除失败');
        }
    };

    // 配送方式标签
    const getDeliveryTags = (deliveryMethods: DeliveryMethods) => {
        const tags = [];
        if (deliveryMethods.express?.enabled) {
            tags.push(
                <Tag key="express" color="blue">
                    快递 ({deliveryMethods.express.coverageAreas.length})
                </Tag>
            );
        }
        if (deliveryMethods.instant?.enabled) {
            tags.push(
                <Tag key="instant" color="green">
                    即时 ({deliveryMethods.instant.coverageAreas.length})
                </Tag>
            );
        }
        return tags.length > 0 ? tags : <Tag color="default">未配置</Tag>;
    };

    const columns = [
        {
            title: '商家编码',
            dataIndex: 'merchantCode',
            key: 'merchantCode',
            width: 120,
        },
        {
            title: '商家名称',
            dataIndex: 'merchantName',
            key: 'merchantName',
            width: 150,
        },
        {
            title: '联系人',
            dataIndex: 'contactPerson',
            key: 'contactPerson',
            width: 100,
        },
        {
            title: '联系电话',
            dataIndex: 'contactPhone',
            key: 'contactPhone',
            width: 120,
        },
        {
            title: '地址',
            key: 'address',
            width: 200,
            render: (_: any, record: Merchant) => {
                if (!record.address) return '-';
                return `${record.address.province} ${record.address.city} ${record.address.district}`;
            },
        },
        {
            title: '配送方式',
            key: 'deliveryMethods',
            width: 150,
            render: (_: any, record: Merchant) => getDeliveryTags(record.deliveryMethods),
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status: string, record: Merchant) => (
                <Select
                    value={status}
                    onChange={(value: 'active' | 'inactive' | 'suspended') => handleStatusChange(record._id!, value)}
                    style={{ width: 100 }}
                    size="small"
                >
                    <Option value="active">营业中</Option>
                    <Option value="inactive">已停业</Option>
                    <Option value="suspended">已暂停</Option>
                </Select>
            ),
        },
        {
            title: '操作',
            key: 'action',
            width: 200,
            fixed: 'right' as const,
            render: (_: any, record: Merchant) => (
                <Space size="small">
                    <Tooltip title="编辑商家信息">
                        <Button
                            type="link"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                        >
                            编辑
                        </Button>
                    </Tooltip>
                    <Tooltip title="配置配送范围">
                        <Button
                            type="link"
                            size="small"
                            icon={<SettingOutlined />}
                            onClick={() => handleConfigDelivery(record)}
                        >
                            配送
                        </Button>
                    </Tooltip>
                    <Popconfirm
                        title="确定删除该商家吗？"
                        onConfirm={() => handleDelete(record._id!)}
                        okText="确定"
                        cancelText="取消"
                    >
                        <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                            删除
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: 24 }}>
            <Card>
                <Space orientation="vertical" size="large" style={{ width: '100%' }}>
                    {/* 搜索和筛选 */}
                    <Space wrap style={{ marginBottom: 16 }}>
                        <Input
                            placeholder="搜索商家名称、编码或联系人"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            onPressEnter={handleSearch}
                            style={{ width: 280 }}
                            prefix={<SearchOutlined />}
                        />
                        <Select
                            placeholder="筛选状态"
                            value={statusFilter || undefined}
                            onChange={setStatusFilter}
                            allowClear
                            style={{ width: 120 }}
                        >
                            <Option value="active">营业中</Option>
                            <Option value="inactive">已停业</Option>
                            <Option value="suspended">已暂停</Option>
                        </Select>
                        <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                            搜索
                        </Button>
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                            新建商家
                        </Button>
                    </Space>

                    {/* 商家列表表格 */}
                    <Table
                        columns={columns}
                        dataSource={merchants}
                        rowKey="_id"
                        loading={loading}
                        pagination={pagination}
                        onChange={handleTableChange}
                        scroll={{ x: 1300 }}
                    />
                </Space>
            </Card>

            {/* 商家表单模态框 */}
            <MerchantFormModal
                visible={formModalVisible}
                onCancel={() => setFormModalVisible(false)}
                onSubmit={handleFormSubmit}
                initialValues={currentMerchant}
                title={modalTitle}
            />

            {/* 配送范围配置模态框 */}
            {currentMerchant && (
                <DeliveryRangeModal
                    visible={deliveryModalVisible}
                    onCancel={() => setDeliveryModalVisible(false)}
                    onSubmit={handleDeliverySubmit}
                    initialValues={currentMerchant.deliveryMethods}
                    merchantName={currentMerchant.merchantName}
                />
            )}
        </div>
    );
};

export default MerchantManagement;
