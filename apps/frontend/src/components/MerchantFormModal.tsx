import { Modal, Form, Input, Select, Cascader, TimePicker, message } from 'antd';
import { useEffect } from 'react';
import { Merchant } from '../services/merchantService';
import { areaData } from '../utils/areaData';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

interface MerchantFormModalProps {
    visible: boolean;
    onCancel: () => void;
    onSubmit: (values: any) => Promise<void>;
    initialValues?: Merchant | null;
    title: string;
}

const MerchantFormModal: React.FC<MerchantFormModalProps> = ({
    visible,
    onCancel,
    onSubmit,
    initialValues,
    title,
}) => {
    const [form] = Form.useForm();

    useEffect(() => {
        if (visible && initialValues) {
            // 处理地址级联选择器的值
            const addressCascade = initialValues.address
                ? [
                      initialValues.address.province,
                      initialValues.address.city,
                      initialValues.address.district,
                  ]
                : undefined;

            // 处理营业时间
            const businessHours = initialValues.businessHours
                ? [
                      dayjs(initialValues.businessHours.start, 'HH:mm'),
                      dayjs(initialValues.businessHours.end, 'HH:mm'),
                  ]
                : undefined;

            form.setFieldsValue({
                ...initialValues,
                addressCascade,
                businessHours,
                detailAddress: initialValues.address?.detailAddress,
            });
        } else if (visible) {
            form.resetFields();
            // 设置默认值
            form.setFieldsValue({
                status: 'active',
            });
        }
    }, [visible, initialValues, form]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();

            // 处理地址数据
            const addressData = values.addressCascade
                ? {
                      province: values.addressCascade[0],
                      city: values.addressCascade[1],
                      district: values.addressCascade[2],
                      detailAddress: values.detailAddress || '',
                  }
                : undefined;

            // 处理营业时间
            const businessHoursData = values.businessHours
                ? {
                      start: values.businessHours[0].format('HH:mm'),
                      end: values.businessHours[1].format('HH:mm'),
                  }
                : undefined;

            const submitData = {
                merchantName: values.merchantName,
                merchantCode: values.merchantCode,
                contactPerson: values.contactPerson,
                contactPhone: values.contactPhone,
                email: values.email,
                address: addressData,
                status: values.status,
                businessHours: businessHoursData,
                description: values.description,
                // 如果是新建商家，设置默认的配送方式配置
                ...((!initialValues || !initialValues._id) && {
                    deliveryMethods: {
                        express: {
                            enabled: true,
                            coverageAreas: [],
                        },
                        instant: {
                            enabled: false,
                            coverageAreas: [],
                        },
                    },
                }),
            };

            await onSubmit(submitData);
            form.resetFields();
        } catch (error: any) {
            console.error('表单验证失败:', error);
            message.error('请完善表单信息');
        }
    };

    return (
        <Modal
            title={title}
            open={visible}
            onCancel={onCancel}
            onOk={handleSubmit}
            width={700}
            okText="确定"
            cancelText="取消"
        >
            <Form
                form={form}
                layout="vertical"
                autoComplete="off"
            >
                <Form.Item
                    label="商家名称"
                    name="merchantName"
                    rules={[{ required: true, message: '请输入商家名称' }]}
                >
                    <Input placeholder="请输入商家名称" />
                </Form.Item>

                <Form.Item
                    label="商家编码"
                    name="merchantCode"
                    rules={[{ required: true, message: '请输入商家编码' }]}
                >
                    <Input placeholder="请输入商家编码（唯一标识）" disabled={!!initialValues?._id} />
                </Form.Item>

                <Form.Item
                    label="联系人"
                    name="contactPerson"
                    rules={[{ required: true, message: '请输入联系人' }]}
                >
                    <Input placeholder="请输入联系人" />
                </Form.Item>

                <Form.Item
                    label="联系电话"
                    name="contactPhone"
                    rules={[
                        { required: true, message: '请输入联系电话' },
                        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' },
                    ]}
                >
                    <Input placeholder="请输入联系电话" />
                </Form.Item>

                <Form.Item
                    label="邮箱"
                    name="email"
                    rules={[{ type: 'email', message: '请输入正确的邮箱地址' }]}
                >
                    <Input placeholder="请输入邮箱" />
                </Form.Item>

                <Form.Item
                    label="商家地址"
                    name="addressCascade"
                    rules={[{ required: true, message: '请选择商家地址' }]}
                >
                    <Cascader
                        options={areaData}
                        placeholder="请选择省市区"
                        showSearch
                    />
                </Form.Item>

                <Form.Item
                    label="详细地址"
                    name="detailAddress"
                >
                    <Input placeholder="请输入详细地址" />
                </Form.Item>

                <Form.Item
                    label="营业时间"
                    name="businessHours"
                >
                    <TimePicker.RangePicker format="HH:mm" />
                </Form.Item>

                <Form.Item
                    label="商家状态"
                    name="status"
                    rules={[{ required: true, message: '请选择商家状态' }]}
                >
                    <Select placeholder="请选择商家状态">
                        <Option value="active">营业中</Option>
                        <Option value="inactive">已停业</Option>
                        <Option value="suspended">已暂停</Option>
                    </Select>
                </Form.Item>

                <Form.Item
                    label="备注"
                    name="description"
                >
                    <TextArea rows={3} placeholder="请输入备注信息" />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default MerchantFormModal;
