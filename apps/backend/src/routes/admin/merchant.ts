import { Router, Request, Response } from 'express';
import Merchant from '../../models/merchant.js';
import { sendResponse } from '../../utils/index.js';

const router = Router();

/**
 * @route   POST /api/admin/merchant
 * @desc    创建商家
 * @access  Admin
 */
router.post('/merchant', async (req: Request, res: Response) => {
    try {
        const merchantData = req.body;

        // 验证必填字段
        if (!merchantData.merchantName || !merchantData.merchantCode || !merchantData.contactPerson || !merchantData.contactPhone) {
            return sendResponse(res, 400, '缺少必填字段', {});
        }

        // 检查商家编码是否已存在
        const existingMerchant = await Merchant.findOne({ merchantCode: merchantData.merchantCode });
        if (existingMerchant) {
            return sendResponse(res, 400, '商家编码已存在', {});
        }

        const merchant = new Merchant(merchantData);
        await merchant.save();

        sendResponse(res, 200, '商家创建成功', merchant);
    } catch (error: any) {
        console.error('创建商家失败:', error);
        sendResponse(res, 500, '创建商家失败', { error: error.message });
    }
});

/**
 * @route   GET /api/admin/merchant/list
 * @desc    获取商家列表
 * @access  Admin
 */
router.get('/merchant/list', async (req: Request, res: Response) => {
    try {
        const { page = 1, pageSize = 10, status, keyword } = req.query;

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
            .skip((Number(page) - 1) * Number(pageSize))
            .limit(Number(pageSize))
            .populate('userId', 'username phoneNumber');

        sendResponse(res, 200, '获取商家列表成功', {
            merchants,
            pagination: {
                page: Number(page),
                pageSize: Number(pageSize),
                total,
                totalPages: Math.ceil(total / Number(pageSize)),
            },
        });
    } catch (error: any) {
        console.error('获取商家列表失败:', error);
        sendResponse(res, 500, '获取商家列表失败', { error: error.message });
    }
});

/**
 * @route   GET /api/admin/merchant/:id
 * @desc    获取商家详情
 * @access  Admin
 */
router.get('/merchant/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const merchant = await Merchant.findById(id).populate('userId', 'username phoneNumber');
        if (!merchant) {
            return sendResponse(res, 404, '商家不存在', {});
        }

        sendResponse(res, 200, '获取商家详情成功', merchant);
    } catch (error: any) {
        console.error('获取商家详情失败:', error);
        sendResponse(res, 500, '获取商家详情失败', { error: error.message });
    }
});

/**
 * @route   PUT /api/admin/merchant/:id
 * @desc    更新商家信息
 * @access  Admin
 */
router.put('/merchant/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // 如果要更新商家编码，检查是否已存在
        if (updateData.merchantCode) {
            const existingMerchant = await Merchant.findOne({ 
                merchantCode: updateData.merchantCode,
                _id: { $ne: id }
            });
            if (existingMerchant) {
                return sendResponse(res, 400, '商家编码已存在', {});
            }
        }

        const merchant = await Merchant.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!merchant) {
            return sendResponse(res, 404, '商家不存在', {});
        }

        sendResponse(res, 200, '商家信息更新成功', merchant);
    } catch (error: any) {
        console.error('更新商家信息失败:', error);
        sendResponse(res, 500, '更新商家信息失败', { error: error.message });
    }
});

/**
 * @route   PUT /api/admin/merchant/:id/delivery-range
 * @desc    更新商家配送范围
 * @access  Admin
 */
router.put('/merchant/:id/delivery-range', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { deliveryMethods } = req.body;

        if (!deliveryMethods) {
            return sendResponse(res, 400, '缺少配送方式配置', {});
        }

        const merchant = await Merchant.findByIdAndUpdate(
            id,
            { $set: { deliveryMethods } },
            { new: true, runValidators: true }
        );

        if (!merchant) {
            return sendResponse(res, 404, '商家不存在', {});
        }

        sendResponse(res, 200, '配送范围更新成功', merchant);
    } catch (error: any) {
        console.error('更新配送范围失败:', error);
        sendResponse(res, 500, '更新配送范围失败', { error: error.message });
    }
});

/**
 * @route   PUT /api/admin/merchant/:id/status
 * @desc    更新商家状态
 * @access  Admin
 */
router.put('/merchant/:id/status', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['active', 'inactive', 'suspended'].includes(status)) {
            return sendResponse(res, 400, '无效的状态值', {});
        }

        const merchant = await Merchant.findByIdAndUpdate(
            id,
            { $set: { status } },
            { new: true }
        );

        if (!merchant) {
            return sendResponse(res, 404, '商家不存在', {});
        }

        sendResponse(res, 200, '商家状态更新成功', merchant);
    } catch (error: any) {
        console.error('更新商家状态失败:', error);
        sendResponse(res, 500, '更新商家状态失败', { error: error.message });
    }
});

/**
 * @route   DELETE /api/admin/merchant/:id
 * @desc    删除商家
 * @access  Admin
 */
router.delete('/merchant/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const merchant = await Merchant.findByIdAndDelete(id);
        if (!merchant) {
            return sendResponse(res, 404, '商家不存在', {});
        }

        sendResponse(res, 200, '商家删除成功', {});
    } catch (error: any) {
        console.error('删除商家失败:', error);
        sendResponse(res, 500, '删除商家失败', { error: error.message });
    }
});

export default router;
