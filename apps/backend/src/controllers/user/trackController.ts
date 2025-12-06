import type { Request, Response } from 'express';
import UserTrackService from '../../services/user/trackService.js';
import { sendResponse } from '../../utils/index.js';

export class UserTrackController {
  // 根据id查询
  async getTrackById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        sendResponse(res, 400, '物流ID不能为空', {});
        return;
      }

      const track = await UserTrackService.getTrackById(id);
      if (!track) {
        sendResponse(res, 404, '未找到物流信息', {});
        return;
      }
      sendResponse(res, 200, 'Success', track);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '获取物流信息失败';
      sendResponse(res, 500, errorMessage, {});
    }
  }

  // 根据订单id查询
  async getTracksByOrderId(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      if (!orderId) {
        sendResponse(res, 400, '订单ID不能为空', {});
        return;
      }

      const tracks = await UserTrackService.getTracksByOrderId(orderId);
      if (!tracks || tracks.length === 0) {
        sendResponse(res, 404, '未找到物流信息', {});
        return;
      }
      sendResponse(res, 200, 'Success', tracks);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '获取物流信息失败';
      sendResponse(res, 500, errorMessage, {});
    }
  }

  // 根据物流单号查询
  async getTrackByLogisticsNumber(req: Request, res: Response): Promise<void> {
    try {
      const { logisticsNumber } = req.params;
      if (!logisticsNumber) {
        sendResponse(res, 400, '物流单号不能为空', {});
        return;
      }

      const track = await UserTrackService.getTrackByLogisticsNumber(logisticsNumber);
      if (!track) {
        sendResponse(res, 404, '未找到物流信息', {});
        return;
      }
      sendResponse(res, 200, 'Success', track);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '获取物流信息失败';
      sendResponse(res, 500, errorMessage, {});
    }
  }
}

export default new UserTrackController();

