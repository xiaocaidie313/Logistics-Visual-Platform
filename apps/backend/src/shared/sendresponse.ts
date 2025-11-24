// 共用的一些函数 

// 同一的响应格式
import type { Response } from 'express';

export const sendResponse = (res: Response, code: number, message: string, data: unknown = {}) => {
    return res.status(code === 200 ? 200 : code).json({ code, message, data });
};