import type { Request, Response } from 'express';
import MerchantService from '../../services/admin/merchantService.js';
import { sendResponse } from '../../utils/index.js';

export class MerchantController {
  // 创建商家
  async createMerchant(req: Request, res: Response): Promise<void> {
    try {
      const merchantData = req.body;
      const merchant = await MerchantService.createMerchant(merchantData);
      sendResponse(res, 200, '商家创建成功', merchant);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '创建商家失败';
      sendResponse(res, 400, errorMessage, {});
    }
  }

  // 获取商家列表
  async getMerchantList(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, pageSize = 10, status, keyword } = req.query;
      const result = await MerchantService.getMerchantList({
        page: Number(page),
        pageSize: Number(pageSize),
        status: status as string,
        keyword: keyword as string
      });
      sendResponse(res, 200, '获取商家列表成功', result);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '获取商家列表失败';
      sendResponse(res, 400, errorMessage, {});
    }
  }

  // 获取商家详情
  async getMerchant(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        sendResponse(res, 400, '商家ID不能为空', {});
        return;
      }
      const merchant = await MerchantService.getMerchantById(id);
      if (!merchant) {
        sendResponse(res, 404, '商家不存在', {});
        return;
      }
      sendResponse(res, 200, '获取商家详情成功', merchant);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '获取商家详情失败';
      sendResponse(res, 400, errorMessage, {});
    }
  }

  // 更新商家信息
  async updateMerchant(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        sendResponse(res, 400, '商家ID不能为空', {});
        return;
      }
      const updateData = req.body;
      const merchant = await MerchantService.updateMerchant(id, updateData);
      if (!merchant) {
        sendResponse(res, 404, '商家不存在', {});
        return;
      }
      sendResponse(res, 200, '商家信息更新成功', merchant);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '更新商家信息失败';
      sendResponse(res, 400, errorMessage, {});
    }
  }

  // 更新商家配送范围
  async updateDeliveryRange(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        sendResponse(res, 400, '商家ID不能为空', {});
        return;
      }
      const { deliveryMethods } = req.body;
      const merchant = await MerchantService.updateDeliveryRange(id, deliveryMethods);
      if (!merchant) {
        sendResponse(res, 404, '商家不存在', {});
        return;
      }
      sendResponse(res, 200, '配送范围更新成功', merchant);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '更新配送范围失败';
      sendResponse(res, 400, errorMessage, {});
    }
  }

  // 更新商家状态
  async updateMerchantStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        sendResponse(res, 400, '商家ID不能为空', {});
        return;
      }
      const { status } = req.body;
      if (!status) {
        sendResponse(res, 400, '状态不能为空', {});
        return;
      }
      const merchant = await MerchantService.updateMerchantStatus(id, status);
      if (!merchant) {
        sendResponse(res, 404, '商家不存在', {});
        return;
      }
      sendResponse(res, 200, '商家状态更新成功', merchant);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '更新商家状态失败';
      sendResponse(res, 400, errorMessage, {});
    }
  }

  // 删除商家
  async deleteMerchant(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        sendResponse(res, 400, '商家ID不能为空', {});
        return;
      }
      const merchant = await MerchantService.deleteMerchant(id);
      if (!merchant) {
        sendResponse(res, 404, '商家不存在', {});
        return;
      }
      sendResponse(res, 200, '商家删除成功', {});
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '删除商家失败';
      sendResponse(res, 400, errorMessage, {});
    }
  }
}

export default new MerchantController();

