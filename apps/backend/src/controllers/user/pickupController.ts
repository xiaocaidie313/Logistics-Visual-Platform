import { Request, Response } from 'express';
import TrackInfo from '../../models/track.js';
import Order from '../../models/order.js';
import { sendResponse } from '../../utils/index.js';
import { validatePickupCode } from '../../utils/pickupCodeGenerator.js';

export class PickupController {
  // 根据取件码查询物流信息
  async getTrackByPickupCode(req: Request, res: Response): Promise<void> {
    try {
      const { pickupCode } = req.params;
      
      if (!validatePickupCode(pickupCode)) {
        sendResponse(res, 400, '取件码格式错误，应为6位数字', {});
        return;
      }

      const track = await TrackInfo.findOne({ pickupCode });
      
      if (!track) {
        sendResponse(res, 404, '未找到对应的物流信息', {});
        return;
      }

      // 检查取件码是否过期
      if (track.pickupCodeExpiresAt && new Date() > track.pickupCodeExpiresAt) {
        sendResponse(res, 400, '取件码已过期', {});
        return;
      }

      sendResponse(res, 200, 'Success', track);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '查询失败';
      sendResponse(res, 500, errorMessage, {});
    }
  }

  // 根据取件码查询订单信息
  async getOrderByPickupCode(req: Request, res: Response): Promise<void> {
    try {
      const { pickupCode } = req.params;
      
      if (!validatePickupCode(pickupCode)) {
        sendResponse(res, 400, '取件码格式错误，应为6位数字', {});
        return;
      }

      const order = await Order.findOne({ pickupCode });
      
      if (!order) {
        sendResponse(res, 404, '未找到对应的订单信息', {});
        return;
      }

      sendResponse(res, 200, 'Success', order);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '查询失败';
      sendResponse(res, 500, errorMessage, {});
    }
  }

  // 验证取件码（用于自提柜等场景）
  async verifyPickupCode(req: Request, res: Response): Promise<void> {
    try {
      const { pickupCode, orderId } = req.body;
      
      if (!validatePickupCode(pickupCode)) {
        sendResponse(res, 400, '取件码格式错误', {});
        return;
      }

      const track = await TrackInfo.findOne({ 
        pickupCode,
        orderId 
      });
      
      if (!track) {
        sendResponse(res, 400, '取件码与订单不匹配', {});
        return;
      }

      // 检查是否已签收
      if (track.logisticsStatus !== 'delivered' && track.logisticsStatus !== 'waiting_for_delivery' && track.logisticsStatus !== 'delivering') {
        sendResponse(res, 400, '快递尚未到达，无法取件', {});
        return;
      }

      // 检查是否过期
      if (track.pickupCodeExpiresAt && new Date() > track.pickupCodeExpiresAt) {
        sendResponse(res, 400, '取件码已过期', {});
        return;
      }

      sendResponse(res, 200, '验证成功', { valid: true, track });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '验证失败';
      sendResponse(res, 500, errorMessage, {});
    }
  }
}

export default new PickupController();

