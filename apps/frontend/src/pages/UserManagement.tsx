import { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, message, Input, Card, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined, ManOutlined, WomanOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import UserFormModal from '../components/UserFormModal';
import type { User } from '../services/userService';
import {
  getUserList,
  createUser,
  updateUser,
  deleteUser,
} from '../services/userService';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<User | undefined>();
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  // 加载用户列表
  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await getUserList();
      if (response.code === 200) {
        setUsers(response.data);
      } else {
        message.error(response.message || '获取用户列表失败');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // 打开创建用户模态框
  const handleCreate = () => {
    setModalMode('create');
    setSelectedUser(undefined);
    setModalOpen(true);
  };

  // 打开编辑用户模态框
  const handleEdit = (record: User) => {
    setModalMode('edit');
    setSelectedUser(record);
    setModalOpen(true);
  };

  // 删除用户
  const handleDelete = (record: User) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除用户 "${record.username}" 吗?`,
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await deleteUser(record._id!);
          if (response.code === 200) {
            message.success('删除用户成功');
            loadUsers();
          } else {
            message.error(response.message || '删除用户失败');
          }
        } catch (error: any) {
          message.error(error.response?.data?.message || '删除用户失败');
        }
      },
    });
  };

  // 提交表单
  const handleSubmit = async (values: Omit<User, '_id'>) => {
    try {
      if (modalMode === 'create') {
        const response = await createUser(values);
        if (response.code === 200) {
          message.success('创建用户成功');
        } else {
          message.error(response.message || '创建用户失败');
        }
      } else {
        const response = await updateUser(selectedUser!._id!, values);
        if (response.code === 200) {
          message.success('更新用户成功');
        } else {
          message.error(response.message || '更新用户失败');
        }
      }
      loadUsers();
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
      throw error;
    }
  };

  // 性别标签渲染
  const renderGender = (gender?: string) => {
    switch (gender) {
      case 'male':
        return <Tag icon={<ManOutlined />} color="blue">男</Tag>;
      case 'female':
        return <Tag icon={<WomanOutlined />} color="pink">女</Tag>;
      default:
        return <Tag color="default">未设置</Tag>;
    }
  };

  const renderRole = (role?: string) => {
    switch (role) {
      case 'admin':
        return <Tag color="red">管理员</Tag>;
      case 'merchant':
        return <Tag color="blue">商家</Tag>;
      case 'customer':
        return <Tag color="green">顾客</Tag>;
      default:
        return <Tag color="default">未设置</Tag>;
    }
  };

  // 格式化地址显示
  const formatAddress = (addresses: User['addresses']) => {
    if (!addresses || addresses.length === 0) {
      return <span style={{ color: '#999' }}>暂无地址</span>;
    }
    const defaultAddress = addresses.find(addr => addr?.isDefault) || addresses[0];
    if (!defaultAddress) {
      return <span style={{ color: '#999' }}>暂无地址</span>;
    }
    return `${defaultAddress.province}${defaultAddress.city}${defaultAddress.district}${defaultAddress.detailAddress}`;
  };

  // 表格列定义
  const columns: ColumnsType<User> = [
    {
      title: '序号',
      key: 'index',
      width: 80,
      align: 'center',
      render: (_, __, index) => {
        const { current = 1, pageSize = 10 } = pagination;
        return (current - 1) * pageSize + index + 1;
      },
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 150,
    },
    {
      title: '手机号码',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
      width: 150,
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      align: 'center',
      render: (role) => renderRole(role),
      filters: [
        { text: '管理员', value: 'admin' },
        { text: '商家', value: 'merchant' },
        { text: '顾客', value: 'customer' },
      ],
      onFilter: (value, record) => record.role === value,
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 100,
      align: 'center',
      render: (gender) => renderGender(gender),
    },
    {
      title: '默认地址',
      dataIndex: 'addresses',
      key: 'addresses',
      width: 300,
      ellipsis: true,
      render: (addresses) => formatAddress(addresses),
    },
    {
      title: '地址数量',
      dataIndex: 'addresses',
      key: 'addressCount',
      width: 100,
      align: 'center',
      render: (addresses) => <Tag color="cyan">{addresses?.length || 0} 个</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  // 过滤用户数据
  const filteredUsers = users.filter(user => {
    const searchLower = searchText.toLowerCase();
    const addressText = user.addresses?.map(addr => 
      `${addr.province}${addr.city}${addr.district}${addr.detailAddress}`
    ).join(' ') || '';
    
    return (
      user.username?.toLowerCase().includes(searchLower) ||
      user.phoneNumber?.includes(searchText) ||
      addressText.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space>
            <span style={{ fontSize: '18px', fontWeight: 600 }}>用户管理</span>
            <Tag color="purple">{users.length} 位用户</Tag>
          </Space>
        }
        extra={
          <Space>
            <Input
              placeholder="搜索用户名、手机号、地址"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 240 }}
              allowClear
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={loadUsers}
            >
              刷新
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              创建用户
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredUsers}
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
          scroll={{ x: 1200 }}
        />
      </Card>

      <UserFormModal
        open={modalOpen}
        mode={modalMode}
        initialValues={selectedUser}
        onCancel={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false);
          loadUsers();
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default UserManagement;
