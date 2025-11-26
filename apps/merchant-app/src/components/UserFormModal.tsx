import { Modal, Form, Input, message, Cascader, Radio, Tabs, Button, Space, Tag } from 'antd';
import { useState, useEffect } from 'react';
import { PlusOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';
import type { User, Address } from '../services/userService';
import { areaData } from '../utils/areaData';

interface UserFormModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  initialValues?: User;
  onCancel: () => void;
  onSuccess: () => void;
  onSubmit: (values: Omit<User, '_id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

interface FormValues {
  username: string;
  phoneNumber: string;
  password?: string;
  gender?: 'male' | 'female' | 'other';
}

const UserFormModal: React.FC<UserFormModalProps> = ({
  open,
  mode,
  initialValues,
  onCancel,
  onSuccess,
  onSubmit,
}) => {
  const [form] = Form.useForm();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && initialValues) {
        form.setFieldsValue({
          username: initialValues.username,
          phoneNumber: initialValues.phoneNumber,
          gender: initialValues.gender || 'other',
        });
        setAddresses(initialValues.addresses || []);
      } else {
        form.resetFields();
        setAddresses([]);
      }
    }
  }, [open, mode, initialValues, form]);

  // 添加新地址
  const handleAddAddress = () => {
    const newAddress: Address = {
      contactName: '',
      contactPhone: '',
      province: '',
      city: '',
      district: '',
      street: '',
      detailAddress: '',
      addressTag: 'home',
      isDefault: addresses.length === 0, // 第一个地址默认设为默认地址
    };
    setAddresses([...addresses, newAddress]);
    setActiveTab('address');
  };

  // 删除地址
  const handleDeleteAddress = (index: number) => {
    const newAddresses = addresses.filter((_, i) => i !== index);
    // 如果删除的是默认地址且还有其他地址,将第一个地址设为默认
    if (addresses[index].isDefault && newAddresses.length > 0) {
      newAddresses[0].isDefault = true;
    }
    setAddresses(newAddresses);
  };

  // 设置默认地址
  const handleSetDefault = (index: number) => {
    const newAddresses = addresses.map((addr, i) => ({
      ...addr,
      isDefault: i === index,
    }));
    setAddresses(newAddresses);
  };

  // 更新地址
  const handleUpdateAddress = (index: number, field: keyof Address, value: any) => {
    const newAddresses = [...addresses];
    newAddresses[index] = { ...newAddresses[index], [field]: value };
    setAddresses(newAddresses);
  };

  // 更新地址区域
  const handleUpdateAddressArea = (index: number, areaCode: string[]) => {
    const newAddresses = [...addresses];
    newAddresses[index] = {
      ...newAddresses[index],
      province: areaCode[0] || '',
      city: areaCode[1] || '',
      district: areaCode[2] || '',
    };
    setAddresses(newAddresses);
  };

  const handleSubmit = async () => {
    try {
      const values: FormValues = await form.validateFields();
      
      // 验证地址信息
      if (addresses.length === 0) {
        message.warning('请至少添加一个地址');
        setActiveTab('address');
        return;
      }

      // 验证每个地址的必填字段
      for (let i = 0; i < addresses.length; i++) {
        const addr = addresses[i];
        if (!addr.contactName || !addr.contactPhone || !addr.province || 
            !addr.city || !addr.district || !addr.detailAddress) {
          message.error(`地址 ${i + 1} 信息不完整,请填写所有必填项`);
          setActiveTab('address');
          return;
        }
        // 验证手机号格式
        if (!/^1[3-9]\d{9}$/.test(addr.contactPhone)) {
          message.error(`地址 ${i + 1} 的收货电话格式不正确`);
          setActiveTab('address');
          return;
        }
      }

      // 构建提交数据
      const userData: Omit<User, '_id' | 'createdAt' | 'updatedAt'> = {
        username: values.username,
        phoneNumber: values.phoneNumber,
        gender: values.gender,
        addresses: addresses,
      };

      // 创建用户时必须有密码
      if (mode === 'create') {
        if (!values.password) {
          message.error('请输入密码');
          return;
        }
        userData.password = values.password;
      } else if (values.password) {
        // 编辑时如果填写了密码,则更新密码
        userData.password = values.password;
      }
      
      await onSubmit(userData);
      form.resetFields();
      setAddresses([]);
      onSuccess();
    } catch (error: any) {
      if (error.errorFields) {
        // 表单验证错误
        return;
      }
      throw error;
    }
  };

  // 渲染地址表单
  const renderAddressForm = (address: Address, index: number) => (
    <div key={index} style={{ marginBottom: 24, padding: 16, border: '1px solid #f0f0f0', borderRadius: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <Space>
          <span style={{ fontWeight: 600 }}>地址 {index + 1}</span>
          {address.isDefault && <Tag color="green" icon={<CheckOutlined />}>默认</Tag>}
        </Space>
        <Space>
          {!address.isDefault && (
            <Button size="small" onClick={() => handleSetDefault(index)}>
              设为默认
            </Button>
          )}
          <Button 
            size="small" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDeleteAddress(index)}
          >
            删除
          </Button>
        </Space>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 4 }}>
            <span style={{ color: '#ff4d4f' }}>*</span> 收货人姓名
          </label>
          <Input
            placeholder="请输入收货人姓名"
            value={address.contactName}
            onChange={(e) => handleUpdateAddress(index, 'contactName', e.target.value)}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 4 }}>
            <span style={{ color: '#ff4d4f' }}>*</span> 收货电话
          </label>
          <Input
            placeholder="请输入收货电话"
            value={address.contactPhone}
            onChange={(e) => handleUpdateAddress(index, 'contactPhone', e.target.value)}
          />
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <label style={{ display: 'block', marginBottom: 4 }}>
          <span style={{ color: '#ff4d4f' }}>*</span> 所在地区
        </label>
        <Cascader
          options={areaData}
          placeholder="请选择省/市/区"
          showSearch
          value={[address.province, address.city, address.district].filter(Boolean)}
          onChange={(value) => handleUpdateAddressArea(index, value as string[])}
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ marginTop: 12 }}>
        <label style={{ display: 'block', marginBottom: 4 }}>街道(可选)</label>
        <Input
          placeholder="请输入街道"
          value={address.street}
          onChange={(e) => handleUpdateAddress(index, 'street', e.target.value)}
        />
      </div>

      <div style={{ marginTop: 12 }}>
        <label style={{ display: 'block', marginBottom: 4 }}>
          <span style={{ color: '#ff4d4f' }}>*</span> 详细地址
        </label>
        <Input.TextArea
          placeholder="请输入详细地址(街道、门牌号等)"
          rows={2}
          value={address.detailAddress}
          onChange={(e) => handleUpdateAddress(index, 'detailAddress', e.target.value)}
          showCount
          maxLength={200}
        />
      </div>

      <div style={{ marginTop: 12 }}>
        <label style={{ display: 'block', marginBottom: 4 }}>地址标签</label>
        <Radio.Group
          value={address.addressTag}
          onChange={(e) => handleUpdateAddress(index, 'addressTag', e.target.value)}
        >
          <Radio.Button value="home">家</Radio.Button>
          <Radio.Button value="company">公司</Radio.Button>
          <Radio.Button value="other">其他</Radio.Button>
        </Radio.Group>
      </div>
    </div>
  );

  return (
    <Modal
      title={mode === 'create' ? '创建用户' : '编辑用户'}
      open={open}
      onOk={handleSubmit}
      onCancel={onCancel}
      width={700}
      destroyOnClose
    >
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={[
          {
            key: 'basic',
            label: '基本信息',
            children: (
              <Form form={form} layout="vertical" autoComplete="off">
                <Form.Item
                  name="username"
                  label="用户名"
                  rules={[
                    { required: true, message: '请输入用户名' },
                    { min: 2, max: 50, message: '用户名长度应在2-50个字符之间' }
                  ]}
                >
                  <Input placeholder="请输入用户名" />
                </Form.Item>

                <Form.Item
                  name="phoneNumber"
                  label="手机号码"
                  rules={[
                    { required: true, message: '请输入手机号码' },
                    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' }
                  ]}
                >
                  <Input placeholder="请输入手机号码" />
                </Form.Item>

                <Form.Item
                  name="password"
                  label={mode === 'create' ? '密码' : '密码(留空表示不修改)'}
                  rules={mode === 'create' ? [
                    { required: true, message: '请输入密码' },
                    { min: 6, message: '密码长度至少6个字符' }
                  ] : [
                    { min: 6, message: '密码长度至少6个字符' }
                  ]}
                >
                  <Input.Password placeholder={mode === 'create' ? '请输入密码' : '留空表示不修改密码'} />
                </Form.Item>

                <Form.Item name="gender" label="性别">
                  <Radio.Group>
                    <Radio value="male">男</Radio>
                    <Radio value="female">女</Radio>
                    <Radio value="other">其他</Radio>
                  </Radio.Group>
                </Form.Item>
              </Form>
            ),
          },
          {
            key: 'address',
            label: `地址信息 ${addresses.length > 0 ? `(${addresses.length})` : ''}`,
            children: (
              <div>
                {addresses.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                    暂无地址,请添加地址
                  </div>
                ) : (
                  addresses.map((addr, index) => renderAddressForm(addr, index))
                )}
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={handleAddAddress}
                  block
                >
                  添加地址
                </Button>
              </div>
            ),
          },
        ]}
      />
    </Modal>
  );
};

export default UserFormModal;
