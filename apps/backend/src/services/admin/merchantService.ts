import Merchant from '../../models/merchant.js';

export class MerchantService {
  // 创建商家
  async createMerchant(merchantData: any): Promise<any> {
    // 验证必填字段
    if (!merchantData.merchantName || !merchantData.merchantCode || !merchantData.contactPerson || !merchantData.contactPhone) {
      throw new Error('缺少必填字段');
    }

    // 检查商家编码是否已存在
    const existingMerchant = await Merchant.findOne({ merchantCode: merchantData.merchantCode });
    if (existingMerchant) {
      throw new Error('商家编码已存在');
    }

    const merchant = new Merchant(merchantData);
    await merchant.save();
    return merchant;
  }

  // 获取商家列表
  async getMerchantList(queryParams: {
    page?: number;
    pageSize?: number;
    status?: string;
    keyword?: string;
  }): Promise<any> {
    const { page = 1, pageSize = 10, status, keyword } = queryParams;

    const query: any = {};

    // 状态筛选
    if (status) {
      query.status = status;
    }

    // 关键词搜索（商家名称或编码）
    if (keyword) {
      query.$or = [
        { merchantName: { $regex: keyword, $options: 'i' } },
        { merchantCode: { $regex: keyword, $options: 'i' } },
        { contactPerson: { $regex: keyword, $options: 'i' } },
      ];
    }

    const total = await Merchant.countDocuments(query);
    const merchants = await Merchant.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate('userId', 'username phoneNumber');

    return {
      merchants,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  // 获取商家详情
  async getMerchantById(id: string): Promise<any> {
    const merchant = await Merchant.findById(id).populate('userId', 'username phoneNumber');
    return merchant;
  }

  // 更新商家信息
  async updateMerchant(id: string, updateData: any): Promise<any> {
    // 如果要更新商家编码，检查是否已存在
    if (updateData.merchantCode) {
      const existingMerchant = await Merchant.findOne({
        merchantCode: updateData.merchantCode,
        _id: { $ne: id }
      });
      if (existingMerchant) {
        throw new Error('商家编码已存在');
      }
    }

    const merchant = await Merchant.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return merchant;
  }

  // 更新商家配送范围
  async updateDeliveryRange(id: string, deliveryMethods: any): Promise<any> {
    if (!deliveryMethods) {
      throw new Error('缺少配送方式配置');
    }

    const merchant = await Merchant.findByIdAndUpdate(
      id,
      { $set: { deliveryMethods } },
      { new: true, runValidators: true }
    );

    return merchant;
  }

  // 更新商家状态
  async updateMerchantStatus(id: string, status: string): Promise<any> {
    if (!['active', 'inactive', 'suspended'].includes(status)) {
      throw new Error('无效的状态值');
    }

    const merchant = await Merchant.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    );

    return merchant;
  }

  // 删除商家
  async deleteMerchant(id: string): Promise<any> {
    const merchant = await Merchant.findByIdAndDelete(id);
    return merchant;
  }
}

export default new MerchantService();

