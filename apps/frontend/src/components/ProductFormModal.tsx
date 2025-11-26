import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, Space, InputNumber, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { Product } from '../services/productService';

interface ProductFormModalProps {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  onSubmit: (productData: Partial<Product>) => void;
}

interface SKU {
  _id?: string;
  skuName: string;
  price: number;
  stock: number;
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({
  visible,
  product,
  onClose,
  onSubmit,
}) => {
  const [form] = Form.useForm();
  const [skus, setSkus] = useState<SKU[]>([]);

  useEffect(() => {
    if (visible) {
      if (product) {
        form.setFieldsValue({
          productName: product.productName,
          category: product.category,
          description: product.description,
          status: product.status,
        });
        setSkus(product.skus || []);
      } else {
        form.resetFields();
        setSkus([]);
      }
    }
  }, [visible, product, form]);

  const handleAddSku = () => {
    const newSku: SKU = {
      skuName: '',
      price: 0,
      stock: 0,
    };
    setSkus([...skus, newSku]);
  };

  const handleDeleteSku = (index: number) => {
    const newSkus = skus.filter((_, i) => i !== index);
    setSkus(newSkus);
  };

  const handleUpdateSku = (index: number, field: keyof SKU, value: any) => {
    const newSkus = [...skus];
    newSkus[index] = { ...newSkus[index], [field]: value };
    setSkus(newSkus);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (skus.length === 0) {
        message.warning('请至少添加一个 SKU');
        return;
      }

      // 验证 SKU 信息
      for (let i = 0; i < skus.length; i++) {
        const sku = skus[i];
        if (!sku.skuName || sku.price <= 0) {
          message.error(`SKU ${i + 1} 信息不完整，请填写 SKU 名称和价格`);
          return;
        }
      }

      const productData: Partial<Product> = {
        productName: values.productName,
        category: values.category,
        description: values.description,
        status: values.status,
        skus: skus,
      };

      onSubmit(productData);
    } catch (error: any) {
      if (error.errorFields) {
        return;
      }
      message.error('提交失败');
    }
  };

  const renderSkuForm = (sku: SKU, index: number) => (
    <div
      key={index}
      style={{
        marginBottom: 16,
        padding: 16,
        border: '1px solid #f0f0f0',
        borderRadius: 8,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <Space>
          <span style={{ fontWeight: 600 }}>SKU {index + 1}</span>
          {sku._id && (
            <span style={{ fontSize: 12, color: '#666' }}>ID: {sku._id}</span>
          )}
        </Space>
        <Button
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteSku(index)}
        >
          删除
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 4 }}>
            <span style={{ color: '#ff4d4f' }}>*</span> SKU 名称
          </label>
          <Input
            placeholder="请输入 SKU 名称"
            value={sku.skuName}
            onChange={(e) => handleUpdateSku(index, 'skuName', e.target.value)}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 4 }}>
            <span style={{ color: '#ff4d4f' }}>*</span> 价格(元)
          </label>
          <InputNumber
            placeholder="价格"
            value={sku.price}
            onChange={(value) => handleUpdateSku(index, 'price', value || 0)}
            min={0}
            step={0.01}
            precision={2}
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 4 }}>库存</label>
          <InputNumber
            placeholder="库存"
            value={sku.stock}
            onChange={(value) => handleUpdateSku(index, 'stock', value || 0)}
            min={0}
            style={{ width: '100%' }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <Modal
      title={product ? '编辑商品' : '新建商品'}
      open={visible}
      onOk={handleSubmit}
      onCancel={onClose}
      width={700}
      destroyOnClose
    >
      <Form form={form} layout="vertical" autoComplete="off">
        <Form.Item
          name="productName"
          label="商品名称"
          rules={[
            { required: true, message: '请输入商品名称' },
            { min: 2, max: 100, message: '商品名称长度应在2-100个字符之间' },
          ]}
        >
          <Input placeholder="请输入商品名称" />
        </Form.Item>

        <Form.Item
          name="category"
          label="分类"
          rules={[{ required: true, message: '请选择分类' }]}
        >
          <Select placeholder="请选择分类">
            <Select.Option value="电子产品">电子产品</Select.Option>
            <Select.Option value="服装">服装</Select.Option>
            <Select.Option value="食品">食品</Select.Option>
            <Select.Option value="图书">图书</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item name="description" label="商品描述">
          <Input.TextArea
            placeholder="请输入商品描述"
            rows={3}
            showCount
            maxLength={500}
          />
        </Form.Item>

        <Form.Item
          name="status"
          label="状态"
          initialValue="active"
          rules={[{ required: true, message: '请选择状态' }]}
        >
          <Select placeholder="请选择状态">
            <Select.Option value="active">在售</Select.Option>
            <Select.Option value="inactive">下架</Select.Option>
            <Select.Option value="out_of_stock">缺货</Select.Option>
          </Select>
        </Form.Item>

        <div style={{ marginTop: 24 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <label style={{ fontWeight: 500 }}>
              <span style={{ color: '#ff4d4f' }}>*</span> SKU 管理
            </label>
          </div>

          {skus.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: 40,
                color: '#999',
                background: '#fafafa',
                borderRadius: 8,
              }}
            >
              暂无 SKU，请添加
            </div>
          ) : (
            skus.map((sku, index) => renderSkuForm(sku, index))
          )}

          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={handleAddSku}
            block
            style={{ marginTop: 16 }}
          >
            添加 SKU
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default ProductFormModal;
