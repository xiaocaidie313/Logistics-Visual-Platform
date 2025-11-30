import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config.js';

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

// 验证密码函数
export const verifyPassword = (password: string, hashedPassword: string, salt: string): boolean => {
    const { hashedPassword: hashToVerify } = hashPassword(password, salt);
    return hashToVerify === hashedPassword;
};


// 移除敏感信息的辅助函数
export const  removeSensitiveInfo = (userObj: any) => {
    const { password, salt, ...safeUser } = userObj;
    return safeUser;
};

//生成token函数
export const Token = ({userId , role}:{userId:string, role:string}) =>{
    return jwt.sign({userId, role}, config.JWT_SECRET, {expiresIn: '1h'});
}

//auth 验证token函数
export const auth = (req:Request, res:Response, next:NextFunction) =>{
    // Express 会将 header 名称转换为小写
    const authHeader = req.headers.authorization || (req.headers as any).Authorization;
    const token = authHeader?.split(' ')[1];
    
    if(!token){
        console.log('Auth 中间件: 未找到 token');
        console.log('请求头 authorization:', req.headers.authorization);
        console.log('请求头 Authorization:', (req.headers as any).Authorization);
        return sendResponse(res, 401, '缺少令牌', {});
    }
    
    try{
        const decoded = jwt.verify(token, config.JWT_SECRET) as {userId:string, role:string};
        (req as any).user = decoded; // 接受解码后的请求
        next();
    }catch(error){
        const errorMessage = error instanceof Error ? error.message : '令牌无效';
        console.log('Auth 中间件: token 验证失败', errorMessage);
        return sendResponse(res, 401, errorMessage, {});
    }
}