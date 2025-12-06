import type { Request, Response } from 'express';
import UserUserInfoService from '../../services/user/userInfoService.js';
import { sendResponse } from '../../utils/index.js';

export class UserUserInfoController {
  // 创建用户信息
  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const userData = req.body;
      const savedUser = await UserUserInfoService.createUser(userData);
      sendResponse(res, 200, 'Success', savedUser);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '创建用户信息失败';
      sendResponse(res, 400, errorMessage, {});
    }
  }

  // 更新用户信息
  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        sendResponse(res, 400, '用户ID不能为空', {});
        return;
      }

      const updateData = req.body;
      const updatedUser = await UserUserInfoService.updateUser(id, updateData);
      
      if (!updatedUser) {
        sendResponse(res, 404, '用户信息不存在', {});
        return;
      }
      
      sendResponse(res, 200, 'Success', updatedUser);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '更新用户信息失败';
      sendResponse(res, 400, errorMessage, {});
    }
  }

  // 删除用户信息
  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        sendResponse(res, 400, '用户ID不能为空', {});
        return;
      }

      const deletedUser = await UserUserInfoService.deleteUser(id);
      if (!deletedUser) {
        sendResponse(res, 404, '用户信息不存在', {});
        return;
      }
      sendResponse(res, 200, 'Success', deletedUser);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '删除用户信息失败';
      sendResponse(res, 400, errorMessage, {});
    }
  }

  // 获取单个用户信息
  async getUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        sendResponse(res, 400, '用户ID不能为空', {});
        return;
      }

      const user = await UserUserInfoService.getUserById(id);
      if (!user) {
        sendResponse(res, 404, '用户信息不存在', {});
        return;
      }
      sendResponse(res, 200, 'Success', user);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '获取用户信息失败';
      sendResponse(res, 400, errorMessage, {});
    }
  }

  // 根据用户名获取用户信息
  async getUserByUsername(req: Request, res: Response): Promise<void> {
    try {
      const { username } = req.params;
      if (!username) {
        sendResponse(res, 400, '用户名不能为空', {});
        return;
      }

      const user = await UserUserInfoService.getUserByUsername(username);
      if (!user) {
        sendResponse(res, 404, '用户信息不存在', {});
        return;
      }
      sendResponse(res, 200, 'Success', user);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '获取用户信息失败';
      sendResponse(res, 400, errorMessage, {});
    }
  }
}

export default new UserUserInfoController();

