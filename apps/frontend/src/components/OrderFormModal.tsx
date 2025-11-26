import { Modal, Form, Input, InputNumber, message, DatePicker, Select, Upload, Button } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import type { Order, OrderStatus } from '../services/orderService';
import { generateUserId } from '../utils/generateId';
import dayjs from 'dayjs';

interface OrderFormModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  initialValues?: Order;
  onCancel: () => void;
  onSuccess: () => void;
  onSubmit: (values: Omit<Order, '_id'>) => Promise<void>;
}

const OrderFormModal: React.FC<OrderFormModalProps> = ({
  open,
  mode,
  initialValues,
  onCancel,
  onSuccess,
  onSubmit,
}) => {
  const [form] = Form.useForm();
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && initialValues) {
        setImageUrl(initialValues.images);
        form.setFieldsValue({
          ...initialValues,
          ordertime: dayjs(initialValues.ordertime),
          sendtime: initialValues.sendtime ? dayjs(initialValues.sendtime) : null,
          arrivetime: initialValues.arrivetime ? dayjs(initialValues.arrivetime) : null,
        });
      } else {
        form.resetFields();
        setImageUrl('');
      }
    }
  }, [open, mode, initialValues, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const orderData = {
        id: mode === 'create' ? generateUserId() : initialValues!.id,
        orderId: mode === 'create' ? `ORD${Date.now()}` : initialValues!.orderId,
        skuname: values.skuname,
        price: values.price,
        amount: values.amount,
        totprice: values.price * values.amount,
        images: imageUrl || 'https://via.placeholder.com/400x400?text=No+Image',
        ordertime: values.ordertime.format('YYYY-MM-DD HH:mm:ss'),
        sendtime: values.sendtime ? values.sendtime.format('YYYY-MM-DD HH:mm:ss') : '',
        arrivetime: values.arrivetime ? values.arrivetime.format('YYYY-MM-DD HH:mm:ss') : '',
        useraddress: values.useraddress,
        sendaddress: values.sendaddress,
        status: values.status,
      };

      await onSubmit(orderData);
      message.success(mode === 'create' ? '创建订单成功' : '更新订单成功');
      form.resetFields();
      setImageUrl('');
      onSuccess();
    } catch (error: any) {
      if (error.errorFields) {
        return;
      }
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const statusOptions: { value: OrderStatus; label: string }[] = [
    { value: 'pending', label: '待支付' },
    { value: 'paid', label: '已支付' },
    { value: 'shipped', label: '已发货' },
    { value: 'confirmed', label: '已确认' },
    { value: 'delivered', label: '已送达' },
    { value: 'cancelled', label: '已取消' },
    { value: 'refunded', label: '已退款' },
  ];

  return (
    <Modal
      title={mode === 'create' ? '创建订单' : '编辑订单'}
      open={open}
      onOk={handleSubmit}
      onCancel={onCancel}
      width={700}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
        initialValues={{ status: 'pending', amount: 1 }}
      >
        <Form.Item
          name="skuname"
          label="商品名称"
          rules={[
            { required: true, message: '请输入商品名称' },
            { min: 2, max: 100, message: '商品名称长度应在2-100个字符之间' }
          ]}
        >
          <Input placeholder="请输入商品名称" />
        </Form.Item>

        <Form.Item label="商品图片">
          <Input
            placeholder="请输入图片URL"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
          {imageUrl && (
            <div style={{ marginTop: 8 }}>
              <img src={imageUrl} alt="preview" style={{ maxWidth: '100%', maxHeight: 200 }} />
            </div>
          )}
        </Form.Item>

        <div style={{ display: 'flex', gap: 16 }}>
          <Form.Item
            name="price"
            label="单价(元)"
            style={{ flex: 1 }}
            rules={[
              { required: true, message: '请输入单价' },
              { type: 'number', min: 0.01, message: '单价必须大于0' }
            ]}
          >
            <InputNumber
              placeholder="请输入单价"
              style={{ width: '100%' }}
              precision={2}
              min={0.01}
            />
          </Form.Item>

          <Form.Item
            name="amount"
            label="数量"
            style={{ flex: 1 }}
            rules={[
              { required: true, message: '请输入数量' },
              { type: 'number', min: 1, message: '数量必须大于0' }
            ]}
          >
            <InputNumber
              placeholder="请输入数量"
              style={{ width: '100%' }}
              min={1}
            />
          </Form.Item>
        </div>

        <Form.Item
          name="sendaddress"
          label="发货地址"
          rules={[
            { required: true, message: '请输入发货地址' },
            { min: 5, max: 200, message: '地址长度应在5-200个字符之间' }
          ]}
        >
          <Input.TextArea
            placeholder="请输入发货地址"
            rows={2}
            showCount
            maxLength={200}
          />
        </Form.Item>

        <Form.Item
          name="useraddress"
          label="收货地址"
          rules={[
            { required: true, message: '请输入收货地址' },
            { min: 5, max: 200, message: '地址长度应在5-200个字符之间' }
          ]}
        >
          <Input.TextArea
            placeholder="请输入收货地址"
            rows={2}
            showCount
            maxLength={200}
          />
        </Form.Item>

        <Form.Item
          name="status"
          label="订单状态"
          rules={[{ required: true, message: '请选择订单状态' }]}
        >
          <Select options={statusOptions} placeholder="请选择订单状态" />
        </Form.Item>

        <div style={{ display: 'flex', gap: 16 }}>
          <Form.Item
            name="ordertime"
            label="下单时间"
            style={{ flex: 1 }}
            rules={[{ required: true, message: '请选择下单时间' }]}
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm:ss"
              style={{ width: '100%' }}
              placeholder="选择下单时间"
            />
          </Form.Item>

          <Form.Item
            name="sendtime"
            label="发货时间"
            style={{ flex: 1 }}
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm:ss"
              style={{ width: '100%' }}
              placeholder="选择发货时间"
            />
          </Form.Item>
        </div>

        <Form.Item
          name="arrivetime"
          label="送达时间"
        >
          <DatePicker
            showTime
            format="YYYY-MM-DD HH:mm:ss"
            style={{ width: '100%' }}
            placeholder="选择送达时间"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default OrderFormModal;
