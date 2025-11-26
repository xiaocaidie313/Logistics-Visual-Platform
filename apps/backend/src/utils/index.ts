import crypto from 'crypto';
import type { Response } from 'express';

// 同一的响应格式
export const sendResponse = (res: Response, code: number, message: string, data: unknown = {}) => {
    return res.status(code === 200 ? 200 : code).json({ code, message, data });
};

// 密码加密函数
export const hashPassword = (password: string, salt?: string): { hashedPassword: string; salt: string } => {
    const passwordSalt = salt || crypto.randomBytes(16).toString('hex');
    const hashedPassword = crypto.pbkdf2Sync(password, passwordSalt, 10000, 64, 'sha512').toString('hex');
    return { hashedPassword, salt: passwordSalt };
};


// 移除敏感信息的辅助函数
export const  removeSensitiveInfo = (userObj: any) => {
    const { password, salt, ...safeUser } = userObj;
    return safeUser;
};
