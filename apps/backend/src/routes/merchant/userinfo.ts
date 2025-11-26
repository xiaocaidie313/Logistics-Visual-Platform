import express from 'express';
import type { Request, Response } from 'express';
import crypto from 'crypto';
import UserInfo from '../../models/userInfo.js';
import { sendResponse } from '../../shared/sendresponse.js';

const router = express.Router();

// 密码加密函数
function hashPassword(password: string, salt?: string): { hashedPassword: string; salt: string } {
    const passwordSalt = salt || crypto.randomBytes(16).toString('hex');
    const hashedPassword = crypto.pbkdf2Sync(password, passwordSalt, 10000, 64, 'sha512').toString('hex');
    return { hashedPassword, salt: passwordSalt };
}

// 移除敏感信息的辅助函数
function removeSensitiveInfo(userObj: any) {
    const { password, salt, ...safeUser } = userObj;
    return safeUser;
}

// 创建用户信息
router.post('/userInfo', async (req: Request, res: Response) => {
    try {
        const userData = req.body;
        
        // 验证必填字段
        if (!userData.username || !userData.phoneNumber || !userData.password) {
            return sendResponse(res, 400, '用户名、手机号和密码为必填项', {});
        }
        
        // 检查用户名是否已存在
        const existingUser = await UserInfo.findOne({ username: userData.username });
        if (existingUser) {
            return sendResponse(res, 400, '用户名已存在', {});
        }
        
        // 检查手机号是否已存在
        const existingPhone = await UserInfo.findOne({ phoneNumber: userData.phoneNumber });
        if (existingPhone) {
            return sendResponse(res, 400, '手机号已被使用', {});
        }
        
        // 加密密码
        const { hashedPassword, salt } = hashPassword(userData.password);
        userData.password = hashedPassword;
        userData.salt = salt;
        
<<<<<<< HEAD
        const newUser = new UserInfo(userData);
        const savedUser = await newUser.save();
        
        // 返回时移除敏感信息
        const userResponse = removeSensitiveInfo(savedUser.toObject());
=======
        // 创建
        const newUser = new Userinfo(userData);
        const savedUser = await newUser.save();
        
        // 返回时移除敏感信息
        const { password: _, salt: __, ...userResponse } = savedUser.toObject();
>>>>>>> 6f98d4f (配置环境变量规避url暴露)
        
        sendResponse(res, 200, '用户创建成功', userResponse);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '创建用户信息失败';
        sendResponse(res, 400, errorMessage, {});
    }
});

// 更新用户信息
router.put('/userInfo/update/:id', async (req: Request, res: Response) => {
    try {
        const newUserData = req.body;
        
        // 如果更新密码,需要重新加密
        if (newUserData.password) {
            const { hashedPassword, salt } = hashPassword(newUserData.password);
            newUserData.password = hashedPassword;
            newUserData.salt = salt;
        }
        
        // 如果更新用户名,检查是否已存在
        if (newUserData.username) {
            const existingUser = await UserInfo.findOne({ 
                username: newUserData.username,
                _id: { $ne: req.params.id }
            });
            if (existingUser) {
                return sendResponse(res, 400, '用户名已存在', {});
            }
        }
        
        // 如果更新手机号,检查是否已存在
        if (newUserData.phoneNumber) {
            const existingPhone = await UserInfo.findOne({ 
                phoneNumber: newUserData.phoneNumber,
                _id: { $ne: req.params.id }
            });
            if (existingPhone) {
                return sendResponse(res, 400, '手机号已被使用', {});
            }
        }
        
        const updatedUser = await UserInfo.findByIdAndUpdate(
            req.params.id, 
            newUserData, 
            { new: true }
        );
        
        if (!updatedUser) {
            return sendResponse(res, 404, '用户信息不存在', {});
        }
        
        // 返回时移除敏感信息
<<<<<<< HEAD
        const userResponse = removeSensitiveInfo(updatedUser.toObject());
=======
        const { password: _, salt: __, ...userResponse } = updatedUser.toObject();
>>>>>>> 6f98d4f (配置环境变量规避url暴露)
        
        sendResponse(res, 200, '用户更新成功', userResponse);
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
        
        // 返回时移除敏感信息
<<<<<<< HEAD
        const userResponse = removeSensitiveInfo(deletedUser.toObject());
=======
        const { password: _, salt: __, ...userResponse } = deletedUser.toObject();
>>>>>>> 6f98d4f (配置环境变量规避url暴露)
        
        sendResponse(res, 200, '用户删除成功', userResponse);
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
        
        // 返回时移除敏感信息
<<<<<<< HEAD
        const userResponse = removeSensitiveInfo(user.toObject());
=======
        const { password: _, salt: __, ...userResponse } = user.toObject();
>>>>>>> 6f98d4f (配置环境变量规避url暴露)
        
        sendResponse(res, 200, 'Success', userResponse);
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
        
        // 返回时移除敏感信息
<<<<<<< HEAD
        const userResponse = removeSensitiveInfo(user.toObject());
=======
        const { password: _, salt: __, ...userResponse } = user.toObject();
>>>>>>> 6f98d4f (配置环境变量规避url暴露)
        
        sendResponse(res, 200, 'Success', userResponse);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '获取用户信息失败';
        sendResponse(res, 400, errorMessage, {});
    }
});

// 获取用户信息列表
router.get('/userInfo/list', async (req: Request, res: Response) => {
    try {
        const users = await UserInfo.find();
        
        // 批量移除敏感信息
<<<<<<< HEAD
        const usersResponse = users.map(user => removeSensitiveInfo(user.toObject()));
=======
        const usersResponse = users.map(user => {
            const { password: _, salt: __, ...userObj } = user.toObject();
            return userObj;
        });
>>>>>>> 6f98d4f (配置环境变量规避url暴露)
        
        sendResponse(res, 200, 'Success', usersResponse);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '获取用户信息列表失败';
        sendResponse(res, 400, errorMessage, {});
    }
});

// 添加/更新用户地址
router.post('/userInfo/:id/address', async (req: Request, res: Response) => {
    try {
        const userId = req.params.id;
        const addressData = req.body;
        
        // 验证必填字段
        const requiredFields = ['contactName', 'contactPhone', 'province', 'city', 'district', 'detailAddress'];
        for (const field of requiredFields) {
            if (!addressData[field]) {
                return sendResponse(res, 400, `${field} 为必填项`, {});
            }
        }
        
        const user = await UserInfo.findById(userId);
        if (!user) {
            return sendResponse(res, 404, '用户信息不存在', {});
        }
        
        // 如果设置为默认地址,先取消其他默认地址
        if (addressData.isDefault) {
            user.addresses.forEach(addr => {
                addr.isDefault = false;
            });
        }
        
        // 添加新地址
        user.addresses.push(addressData);
        await user.save();
        
<<<<<<< HEAD
        const userResponse = removeSensitiveInfo(user.toObject());
=======
        const { password: _, salt: __, ...userResponse } = user.toObject();
>>>>>>> 6f98d4f (配置环境变量规避url暴露)
        
        sendResponse(res, 200, '地址添加成功', userResponse);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '添加地址失败';
        sendResponse(res, 400, errorMessage, {});
    }
});

// 删除用户地址
router.delete('/userInfo/:id/address/:addressId', async (req: Request, res: Response) => {
    try {
        const { id: userId, addressId } = req.params;
        
        const user = await UserInfo.findById(userId);
        if (!user) {
            return sendResponse(res, 404, '用户信息不存在', {});
        }
        
        // 删除指定地址
        user.addresses.pull(addressId);
        await user.save();
        
<<<<<<< HEAD
        const userResponse = removeSensitiveInfo(user.toObject());
=======
        const { password: _, salt: __, ...userResponse } = user.toObject();
>>>>>>> 6f98d4f (配置环境变量规避url暴露)
        
        sendResponse(res, 200, '地址删除成功', userResponse);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '删除地址失败';
        sendResponse(res, 400, errorMessage, {});
    }
});

// 设置默认地址
router.put('/userInfo/:id/address/:addressId/default', async (req: Request, res: Response) => {
    try {
        const { id: userId, addressId } = req.params;
        
        const user = await UserInfo.findById(userId);
        if (!user) {
            return sendResponse(res, 404, '用户信息不存在', {});
        }
        
        // 设置默认地址
        let found = false;
        user.addresses.forEach(addr => {
            if (addr._id?.toString() === addressId) {
                addr.isDefault = true;
                found = true;
            } else {
                addr.isDefault = false;
            }
        });
        
        if (!found) {
            return sendResponse(res, 404, '地址不存在', {});
        }
        
        await user.save();
        
<<<<<<< HEAD
        const userResponse = removeSensitiveInfo(user.toObject());
=======
        const { password: _, salt: __, ...userResponse } = user.toObject();
>>>>>>> 6f98d4f (配置环境变量规避url暴露)
        
        sendResponse(res, 200, '默认地址设置成功', userResponse);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '设置默认地址失败';
        sendResponse(res, 400, errorMessage, {});
    }
});

export default router;

