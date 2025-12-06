import type { Request, Response } from 'express';
import AuthService from '../../services/login/authService.js';
import { sendResponse } from '../../utils/index.js';

export class AuthController {
  // 登录
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password, phoneNumber, role } = req.body;
      const userResponse = await AuthService.login({ username, password, phoneNumber, role });
      sendResponse(res, 200, '登入成功', userResponse);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '登录失败';
      const statusCode = errorMessage.includes('用户名或密码') || errorMessage.includes('角色') ? 401 : 500;
      sendResponse(res, statusCode, errorMessage, {});
    }
  }

  // 注册
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, password, phoneNumber, role } = req.body;
      const userResponse = await AuthService.register({ username, password, phoneNumber, role });
      sendResponse(res, 200, '注册成功', userResponse);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '注册失败';
      const statusCode = errorMessage.includes('已存在') || errorMessage.includes('必填项') ? 400 : 500;
      sendResponse(res, statusCode, errorMessage, {});
    }
  }
}

export default new AuthController();

