import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Cascader, Radio, message } from 'antd';
import type { Address } from '../../services/userService';
import { areaData } from '../../utils/areaData';

interface AddressFormModalProps {
  open: boolean;
  mode: 'add' | 'edit';
  initialValues?: Address;
  onCancel: () => void;
  onSuccess: (address: Address) => void;
}

const AddressFormModal: React.FC<AddressFormModalProps> = ({
  open,
  mode,
  initialValues,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && initialValues) {
        form.setFieldsValue({
          contactName: initialValues.contactName,
          contactPhone: initialValues.contactPhone,
          area: [initialValues.province, initialValues.city, initialValues.district],
          detailAddress: initialValues.detailAddress,
          addressTag: initialValues.addressTag || 'home',
          isDefault: initialValues.isDefault || false,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          addressTag: 'home',
          isDefault: false,
        });
      }
    }
  }, [open, mode, initialValues, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const addressData: Address = {
        contactName: values.contactName,
        contactPhone: values.contactPhone,
        province: values.area[0] || '',
        city: values.area[1] || '',
        district: values.area[2] || '',
        detailAddress: values.detailAddress,
        addressTag: values.addressTag || 'home',
        isDefault: values.isDefault || false,
      };

      // 如果是编辑模式，保留原地址的 _id
      if (mode === 'edit' && initialValues?._id) {
        addressData._id = initialValues._id;
      }

      onSuccess(addressData);
      setLoading(false);
    } catch (error) {
      console.error('表单验证失败:', error);
      setLoading(false);
    }
  };

  return (
    <Modal
      title={mode === 'add' ? '添加收货地址' : '编辑收货地址'}
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText="保存"
      cancelText="取消"
      width={400}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: '20px' }}
      >
        <Form.Item
          name="contactName"
          label="收货人姓名"
          rules={[{ required: true, message: '请输入收货人姓名' }]}
        >
          <Input placeholder="请输入收货人姓名" />
        </Form.Item>

        <Form.Item
          name="contactPhone"
          label="联系电话"
          rules={[
            { required: true, message: '请输入联系电话' },
            { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' },
          ]}
        >
          <Input placeholder="请输入手机号码" maxLength={11} />
        </Form.Item>

        <Form.Item
          name="area"
          label="省市区"
          rules={[{ required: true, message: '请选择省市区' }]}
        >
          <Cascader
            options={areaData}
            placeholder="请选择省市区"
            changeOnSelect={false}
          />
        </Form.Item>

        <Form.Item
          name="detailAddress"
          label="详细地址"
          rules={[{ required: true, message: '请输入详细地址' }]}
        >
          <Input.TextArea
            placeholder="请输入街道、门牌号等详细地址"
            rows={3}
            maxLength={100}
            showCount
          />
        </Form.Item>

        <Form.Item
          name="addressTag"
          label="地址标签"
        >
          <Radio.Group>
            <Radio value="home">家</Radio>
            <Radio value="company">公司</Radio>
            <Radio value="other">其他</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          name="isDefault"
        >
          <Radio.Group>
            <Radio value={true}>设为默认地址</Radio>
            <Radio value={false}>不设为默认地址</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddressFormModal;

