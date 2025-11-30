import express, { Request, Response} from 'express'
import UserInfo from '../../models/userinfo.js'
import { hashPassword, removeSensitiveInfo, sendResponse } from '../../utils/index.js'

const router = express.Router()

// 验证密码函数
const verifyPassword = (password: string, hashedPassword: string, salt: string): boolean => {
    const { hashedPassword: hashToVerify } = hashPassword(password, salt);
    return hashToVerify === hashedPassword;
};

//登入
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { username, password, phoneNumber, role } = req.body;
        
        // 验证必填字段
        if (!password || (!username && !phoneNumber)) {
            return sendResponse(res, 400, '用户名/手机号和密码为必填项', {});
        }
        
        // 需要显式选择password和salt字段
        const user = username 
            ? await UserInfo.findOne({ username }).select('+password +salt')
            : await UserInfo.findOne({ phoneNumber }).select('+password +salt');
        if (!user) {
            return sendResponse(res, 401, '用户名或密码错误', {});
        }
        if(role && role !== user.role) {
            return sendResponse(res, 401, '用户角色错误', {});
        }
        // 验证密码 使用用户存储的salt 来验证
        if (!user.salt || !user.password) {
            return sendResponse(res, 401, '用户数据异常，请联系管理员', {});
        }
        const isPasswordValid = verifyPassword(password, user.password, user.salt);
        if (!isPasswordValid) {
            return sendResponse(res, 401, '用户名或密码错误', {});
        }
        // 返回用户信息（移除敏感信息）
        const userResponse = removeSensitiveInfo(user.toObject());
        return sendResponse(res, 200, '登入成功', userResponse);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '登录失败';
        return sendResponse(res, 500, errorMessage, {});
    }
})
// 注册
router.post('/register', async (req: Request, res: Response) => {
    try {
        const { username, password, phoneNumber, role } = req.body;
        
        // 验证必填字段
        if (!username || !password || !phoneNumber) {
            return sendResponse(res, 400, '用户名、密码和手机号为必填项', {});
        }
        
        // 检查用户名是否已存在
        const existingUser = await UserInfo.findOne({ username });
        if (existingUser) {
            return sendResponse(res, 400, '用户名已存在', {});
        }
        
        // 检查手机号是否已存在（使用 findOne 而不是 find）
        const existingPhone = await UserInfo.findOne({ phoneNumber });
        if (existingPhone) {
            return sendResponse(res, 400, '手机号已存在', {});
        }
        // 加密密码
        const { hashedPassword, salt } = hashPassword(password);
        // 默认为 'customer'
        const newUser = new UserInfo({ 
            username, 
            password: hashedPassword, 
            salt, 
            phoneNumber,
            role: role || 'customer'
        });
        
        await newUser.save();
        // 返回用户信息
        const userResponse = removeSensitiveInfo(newUser.toObject());
        return sendResponse(res, 200, '注册成功', userResponse);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '注册失败';
        return sendResponse(res, 500, errorMessage, {});
    }
})

export default router