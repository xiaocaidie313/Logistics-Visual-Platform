import UserInfo from '../../models/userinfo.js';
import { hashPassword, removeSensitiveInfo, verifyPassword, Token } from '../../utils/index.js';

export class AuthService {
  // 登录
  async login(loginData: { username?: string; phoneNumber?: string; password: string; role?: string }): Promise<any> {
    const { username, password, phoneNumber, role } = loginData;
    
    // 验证必填字段
    if (!password || (!username && !phoneNumber)) {
      throw new Error('用户名/手机号和密码为必填项');
    }
    
    // 需要显式选择password和salt字段
    const user = username 
      ? await UserInfo.findOne({ username }).select('+password +salt')
      : await UserInfo.findOne({ phoneNumber }).select('+password +salt');
    
    if (!user) {
      throw new Error('用户名或密码错误');
    }
    
    if (role && role !== user.role) {
      throw new Error('用户角色错误');
    }
    
    // 验证密码 使用用户存储的salt来验证
    if (!user.salt || !user.password) {
      throw new Error('用户数据异常，请联系管理员');
    }
    
    const isPasswordValid = verifyPassword(password, user.password, user.salt);
    if (!isPasswordValid) {
      throw new Error('用户名或密码错误');
    }
    
    // 返回用户信息,去除敏感信息
    const userResponse = removeSensitiveInfo(user.toObject());
    // 加入token 
    userResponse.token = Token({ userId: user._id.toString(), role: user.role }) as string | undefined;
    
    return userResponse;
  }

  // 注册
  async register(registerData: { username: string; password: string; phoneNumber: string; role?: string }): Promise<any> {
    const { username, password, phoneNumber, role } = registerData;
    
    // 验证必填字段
    if (!username || !password || !phoneNumber) {
      throw new Error('用户名、密码和手机号为必填项');
    }
    
    // 检查用户名是否已存在
    const existingUser = await UserInfo.findOne({ username });
    if (existingUser) {
      throw new Error('用户名已存在');
    }
    
    // 检查手机号是否已存在
    const existingPhone = await UserInfo.findOne({ phoneNumber });
    if (existingPhone) {
      throw new Error('手机号已存在');
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
    return userResponse;
  }
}

export default new AuthService();

