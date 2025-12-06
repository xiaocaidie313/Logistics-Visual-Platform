import type { Request, Response } from 'express';
import TrackService from '../services/trackService.js';
import { sendResponse } from '../../utils/index.js';

export class TrackController {
  // 创建物流记录
  async createTrack(req: Request, res: Response): Promise<void> {
    try {
      const trackData = req.body;
      const savedTrack = await TrackService.createTrack(trackData);
      sendResponse(res, 200, 'Success', savedTrack);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '创建物流记录失败';
      sendResponse(res, 500, errorMessage, {});
    }
  }

  // 根据id查询
  async getTrackById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        sendResponse(res, 400, '物流ID不能为空', {});
        return;
      }
      const track = await TrackService.getTrackById(id);
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
      const tracks = await TrackService.getTracksByOrderId(orderId);
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
      const track = await TrackService.getTrackByLogisticsNumber(logisticsNumber);
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

  // 获取物流列表
  async getTrackList(req: Request, res: Response): Promise<void> {
    try {
      const tracks = await TrackService.getTrackList();
      sendResponse(res, 200, 'Success', tracks);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '获取物流列表失败';
      sendResponse(res, 500, errorMessage, {});
    }
  }

  // 更新物流
  async updateTrack(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        sendResponse(res, 400, '物流ID不能为空', {});
        return;
      }
      const updateData = req.body;
      const updatedTrack = await TrackService.updateTrack(id, updateData);
      if (!updatedTrack) {
        sendResponse(res, 404, '未找到物流信息', {});
        return;
      }
      sendResponse(res, 200, 'Success', updatedTrack);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '更新物流信息失败';
      sendResponse(res, 500, errorMessage, {});
    }
  }

  // 更新状态
  async updateTrackStatus(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      if (!orderId) {
        sendResponse(res, 400, '订单ID不能为空', {});
        return;
      }
      const { status } = req.body;
      if (!status) {
        sendResponse(res, 400, '状态不能为空', {});
        return;
      }
      const track = await TrackService.updateTrackStatus(orderId, status);
      if (!track) {
        sendResponse(res, 404, '未找到物流信息', {});
        return;
      }
      sendResponse(res, 200, 'Success', track);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '更新物流状态失败';
      sendResponse(res, 500, errorMessage, {});
    }
  }

  // 添加物流轨迹节点
  async addTrackNode(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        sendResponse(res, 400, '物流ID不能为空', {});
        return;
      }
      const trackNode = req.body;
      const updatedTrack = await TrackService.addTrackNode(id, trackNode);
      if (!updatedTrack) {
        sendResponse(res, 404, '未找到物流信息', {});
        return;
      }
      sendResponse(res, 200, 'Success', updatedTrack);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '添加物流轨迹失败';
      sendResponse(res, 500, errorMessage, {});
    }
  }

  // 删除物流记录
  async deleteTrack(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        sendResponse(res, 400, '物流ID不能为空', {});
        return;
      }
      const deletedTrack = await TrackService.deleteTrack(id);
      if (!deletedTrack) {
        sendResponse(res, 404, '未找到物流信息', {});
        return;
      }
      sendResponse(res, 200, 'Success', deletedTrack);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '删除物流记录失败';
      sendResponse(res, 500, errorMessage, {});
    }
  }
}

export default new TrackController();

