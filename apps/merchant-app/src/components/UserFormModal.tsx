import { Modal, Form, Input, message, Cascader } from 'antd';
import { useEffect } from 'react';
import type { User } from '../services/userService';
import { areaData } from '../utils/areaData';
import { generateUserId } from '../utils/generateId';

interface UserFormModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  initialValues?: User;
  onCancel: () => void;
  onSuccess: () => void;
  onSubmit: (values: Omit<User, '_id'>) => Promise<void>;
}

interface FormValues {
  username: string;
  areaCode: string[];
  detailAddress: string;
  phoneNumber: string;
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

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && initialValues) {
        // 解析地址：尝试分离省市区和详细地址
        const address = initialValues.useraddress;
        // 简单的分离逻辑，你可以根据实际情况优化
        const parts = parseAddress(address);
        
        form.setFieldsValue({
          username: initialValues.username,
          areaCode: parts.areaCode,
          detailAddress: parts.detailAddress,
          phoneNumber: initialValues.phoneNumber,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, mode, initialValues, form]);

  // 解析地址字符串为省市区数组和详细地址
  const parseAddress = (address: string): { areaCode: string[], detailAddress: string } => {
    // 这是一个简单的实现，你可以根据实际需求优化
    // 假设地址格式为：省/市/区 详细地址
    for (const province of areaData) {
      if (address.startsWith(province.value)) {
        for (const city of province.children || []) {
          if (address.includes(city.value)) {
            for (const district of city.children || []) {
              if (address.includes(district.value)) {
                const detailAddress = address
                  .replace(province.value, '')
                  .replace(city.value, '')
                  .replace(district.value, '')
                  .trim();
                return {
                  areaCode: [province.value, city.value, district.value],
                  detailAddress,
                };
              }
            }
          }
        }
      }
    }
    return { areaCode: [], detailAddress: address };
  };

  const handleSubmit = async () => {
    try {
      const values: FormValues = await form.validateFields();
      
      // 组合地址：省市区 + 详细地址
      const fullAddress = values.areaCode.join('') + values.detailAddress;
      
      // 构建提交数据
      const userData = {
        id: mode === 'create' ? generateUserId() : initialValues!.id,
        username: values.username,
        useraddress: fullAddress,
        phoneNumber: values.phoneNumber,
      };
      
      await onSubmit(userData);
      message.success(mode === 'create' ? '创建用户成功' : '更新用户成功');
      form.resetFields();
      onSuccess();
    } catch (error: any) {
      if (error.errorFields) {
        // 表单验证错误
        return;
      }
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  return (
    <Modal
      title={mode === 'create' ? '创建用户' : '编辑用户'}
      open={open}
      onOk={handleSubmit}
      onCancel={onCancel}
      width={600}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
      >
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
          label="用户地址"
          required
          style={{ marginBottom: 0 }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Form.Item
              name="areaCode"
              rules={[{ required: true, message: '请选择省市区' }]}
            >
              <Cascader
                options={areaData}
                placeholder="请选择省/市/区"
                showSearch
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item
              name="detailAddress"
              rules={[
                { required: true, message: '请输入详细地址' },
                { min: 5, max: 100, message: '详细地址长度应在5-100个字符之间' }
              ]}
            >
              <Input.TextArea 
                placeholder="请输入详细地址（街道、门牌号等）" 
                rows={3}
                showCount
                maxLength={100}
              />
            </Form.Item>
          </div>
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
      </Form>
    </Modal>
  );
};

export default UserFormModal;
