import express from 'express';
import type { Request, Response } from 'express';
import UserInfo from '../../models/userInfo.js';
import { sendResponse } from '../../shared/sendresponse.js';

const router = express.Router();

// 创建用户信息
router.post('/userInfo', async (req: Request, res: Response) => {
    try {
        const userData = req.body;
        const newUser = new UserInfo(userData);
        const savedUser = await newUser.save();
        sendResponse(res, 200, 'Success', savedUser);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '创建用户信息失败';
        sendResponse(res, 400, errorMessage, {});
    }
});

// 更新用户信息
router.put('/userInfo/update/:id', async (req: Request, res: Response) => {
    try {
        const newUserData = req.body;
        const updatedUser = await UserInfo.findByIdAndUpdate(req.params.id, newUserData, { new: true });
        if (!updatedUser) {
            return sendResponse(res, 404, '用户信息不存在', {});
        }
        sendResponse(res, 200, 'Success', updatedUser);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '更新用户信息失败';
        sendResponse(res, 400, errorMessage, {});
    }
});

// 删除用户信息
router.delete('/userInfo/delete/:id', async (req: Request, res: Response) => {
    try {
        const userId = req.params.id;
        const deletedUser = await UserInfo.findByIdAndDelete(userId);
        if (!deletedUser) {
            return sendResponse(res, 404, '用户信息不存在', {});
        }
        sendResponse(res, 200, 'Success', deletedUser);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '删除用户信息失败';
        sendResponse(res, 400, errorMessage, {});
    }
});

// 获取单个用户信息
router.get('/userInfo/get/:id', async (req: Request, res: Response) => {
    try {
        const userId = req.params.id;
        const user = await UserInfo.findById(userId);
        if (!user) {
            return sendResponse(res, 404, '用户信息不存在', {});
        }
        sendResponse(res, 200, 'Success', user);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '获取用户信息失败';
        sendResponse(res, 400, errorMessage, {});
    }
});

// 根据用户名获取用户信息
router.get('/userInfo/username/:username', async (req: Request, res: Response) => {
    try {
        const username = req.params.username;
        const user = await UserInfo.findOne({ username });
        if (!user) {
            return sendResponse(res, 404, '用户信息不存在', {});
        }
        sendResponse(res, 200, 'Success', user);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '获取用户信息失败';
        sendResponse(res, 400, errorMessage, {});
    }
});

// 获取用户信息列表
router.get('/userInfo/list', async (req: Request, res: Response) => {
    try {
        const users = await UserInfo.find();
        sendResponse(res, 200, 'Success', users);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '获取用户信息列表失败';
        sendResponse(res, 400, errorMessage, {});
    }
});

export default router;

