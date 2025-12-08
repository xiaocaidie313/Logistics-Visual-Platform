import type { Request, Response } from "express";
import UserInfoService from "../../services/admin/userInfoService.js";
import { sendResponse } from "../../utils/index.js";

export class UserInfoController {
  // 创建用户信息
  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const userData = req.body;
      const userResponse = await UserInfoService.createUser(userData);
      sendResponse(res, 200, "用户创建成功", userResponse);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "创建用户信息失败";
      sendResponse(res, 400, errorMessage, {});
    }
  }

  // 更新用户信息
  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        sendResponse(res, 400, "用户ID不能为空", {});
        return;
      }
      const updateData = req.body;
      const userResponse = await UserInfoService.updateUser(id, updateData);

      if (!userResponse) {
        sendResponse(res, 404, "用户信息不存在", {});
        return;
      }

      sendResponse(res, 200, "用户更新成功", userResponse);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "更新用户信息失败";
      sendResponse(res, 400, errorMessage, {});
    }
  }

  // 删除用户信息
  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        sendResponse(res, 400, "用户ID不能为空", {});
        return;
      }
      const userResponse = await UserInfoService.deleteUser(id);

      if (!userResponse) {
        sendResponse(res, 404, "用户信息不存在", {});
        return;
      }

      sendResponse(res, 200, "用户删除成功", userResponse);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "删除用户信息失败";
      sendResponse(res, 400, errorMessage, {});
    }
  }

  // 获取单个用户信息
  async getUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        sendResponse(res, 400, "用户ID不能为空", {});
        return;
      }
      const userResponse = await UserInfoService.getUserById(id);

      if (!userResponse) {
        sendResponse(res, 404, "用户信息不存在", {});
        return;
      }

      sendResponse(res, 200, "Success", userResponse);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "获取用户信息失败";
      sendResponse(res, 400, errorMessage, {});
    }
  }

// 获取商家用户信息
async getMerchant(req: Request, res: Response): Promise<void> {
  try {
    const { merchantId } = req.params;
    if (!merchantId) {
      sendResponse(res, 400, '商家ID不能为空', {});
      return;
    }
    const user = await UserInfoService.getMerchantById(merchantId);
    if (!user) {
      sendResponse(res, 404, '商家用户信息不存在', {});
      return;
    }
    sendResponse(res, 200, 'Success', user);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '获取商家用户信息失败';
    sendResponse(res, 400, errorMessage, {});
  }
}
  // 根据用户名获取用户信息
  async getUserByUsername(req: Request, res: Response): Promise<void> {
    try {
      const { username } = req.params;
      if (!username) {
        sendResponse(res, 400, "用户名不能为空", {});
        return;
      }
      const userResponse = await UserInfoService.getUserByUsername(username);

      if (!userResponse) {
        sendResponse(res, 404, "用户信息不存在", {});
        return;
      }

      sendResponse(res, 200, "Success", userResponse);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "获取用户信息失败";
      sendResponse(res, 400, errorMessage, {});
    }
  }

  // 获取用户信息列表
  async getUserList(req: Request, res: Response): Promise<void> {
    try {
      const usersResponse = await UserInfoService.getUserList();
      sendResponse(res, 200, "Success", usersResponse);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "获取用户信息列表失败";
      sendResponse(res, 400, errorMessage, {});
    }
  }

  // 添加/更新用户地址
  async addUserAddress(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        sendResponse(res, 400, "用户ID不能为空", {});
        return;
      }
      const addressData = req.body;
      const userResponse = await UserInfoService.addUserAddress(
        id,
        addressData
      );

      if (!userResponse) {
        sendResponse(res, 404, "用户信息不存在", {});
        return;
      }

      sendResponse(res, 200, "地址添加成功", userResponse);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "添加地址失败";
      sendResponse(res, 400, errorMessage, {});
    }
  }

  // 删除用户地址
  async deleteUserAddress(req: Request, res: Response): Promise<void> {
    try {
      const { id, addressId } = req.params;
      if (!id || !addressId) {
        sendResponse(res, 400, "用户ID或地址ID不能为空", {});
        return;
      }
      const userResponse = await UserInfoService.deleteUserAddress(
        id,
        addressId
      );

      if (!userResponse) {
        sendResponse(res, 404, "用户信息不存在", {});
        return;
      }

      sendResponse(res, 200, "地址删除成功", userResponse);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "删除地址失败";
      sendResponse(res, 400, errorMessage, {});
    }
  }

  // 设置默认地址
  async setDefaultAddress(req: Request, res: Response): Promise<void> {
    try {
      const { id, addressId } = req.params;
      if (!id || !addressId) {
        sendResponse(res, 400, "用户ID或地址ID不能为空", {});
        return;
      }
      const userResponse = await UserInfoService.setDefaultAddress(
        id,
        addressId
      );

      if (!userResponse) {
        sendResponse(res, 404, "用户信息不存在", {});
        return;
      }

      sendResponse(res, 200, "默认地址设置成功", userResponse);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "设置默认地址失败";
      sendResponse(res, 400, errorMessage, {});
    }
  }
}

export default new UserInfoController();
