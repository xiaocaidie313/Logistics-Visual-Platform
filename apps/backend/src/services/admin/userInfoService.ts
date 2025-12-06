import UserInfo from '../../models/userinfo.js';
import { hashPassword, removeSensitiveInfo } from '../../utils/index.js';

export class UserInfoService {
  // 创建用户信息
  async createUser(userData: any): Promise<any> {
    // 验证必填字段
    if (!userData.username || !userData.phoneNumber || !userData.password) {
      throw new Error('用户名、手机号和密码为必填项');
    }

    // 检查用户名是否已存在
    const existingUser = await UserInfo.findOne({ username: userData.username });
    if (existingUser) {
      throw new Error('用户名已存在');
    }

    // 检查手机号是否已存在
    const existingPhone = await UserInfo.findOne({ phoneNumber: userData.phoneNumber });
    if (existingPhone) {
      throw new Error('手机号已被使用');
    }

    // 加密密码
    const { hashedPassword, salt } = hashPassword(userData.password);
    userData.password = hashedPassword;
    userData.salt = salt;

    const newUser = new UserInfo(userData);
    const savedUser = await newUser.save();

    // 返回时移除敏感信息
    return removeSensitiveInfo(savedUser.toObject());
  }

  // 更新用户信息
  async updateUser(userId: string, updateData: any): Promise<any> {
    // 如果更新密码,需要重新加密
    if (updateData.password) {
      const { hashedPassword, salt } = hashPassword(updateData.password);
      updateData.password = hashedPassword;
      updateData.salt = salt;
    }

    // 如果更新用户名,检查是否已存在
    if (updateData.username) {
      const existingUser = await UserInfo.findOne({
        username: updateData.username,
        _id: { $ne: userId }
      });
      if (existingUser) {
        throw new Error('用户名已存在');
      }
    }

    // 如果更新手机号,检查是否已存在
    if (updateData.phoneNumber) {
      const existingPhone = await UserInfo.findOne({
        phoneNumber: updateData.phoneNumber,
        _id: { $ne: userId }
      });
      if (existingPhone) {
        throw new Error('手机号已被使用');
      }
    }

    const updatedUser = await UserInfo.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    );

    if (!updatedUser) {
      return null;
    }

    // 返回时移除敏感信息
    return removeSensitiveInfo(updatedUser.toObject());
  }

  // 删除用户信息
  async deleteUser(userId: string): Promise<any> {
    const deletedUser = await UserInfo.findByIdAndDelete(userId);
    if (!deletedUser) {
      return null;
    }
    // 返回时移除敏感信息
    return removeSensitiveInfo(deletedUser.toObject());
  }

  // 获取单个用户信息
  async getUserById(userId: string): Promise<any> {
    const user = await UserInfo.findById(userId);
    if (!user) {
      return null;
    }
    // 返回时移除敏感信息
    return removeSensitiveInfo(user.toObject());
  }

  // 根据用户名获取用户信息
  async getUserByUsername(username: string): Promise<any> {
    const user = await UserInfo.findOne({ username });
    if (!user) {
      return null;
    }
    // 返回时移除敏感信息
    return removeSensitiveInfo(user.toObject());
  }

  // 获取用户信息列表
  async getUserList(): Promise<any> {
    const users = await UserInfo.find();
    // 批量移除敏感信息
    return users.map(user => removeSensitiveInfo(user.toObject()));
  }

  // 添加/更新用户地址
  async addUserAddress(userId: string, addressData: any): Promise<any> {
    // 验证必填字段
    const requiredFields = ['contactName', 'contactPhone', 'province', 'city', 'district', 'detailAddress'];
    for (const field of requiredFields) {
      if (!addressData[field]) {
        throw new Error(`${field} 为必填项`);
      }
    }

    const user = await UserInfo.findById(userId);
    if (!user) {
      return null;
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

    return removeSensitiveInfo(user.toObject());
  }

  // 删除用户地址
  async deleteUserAddress(userId: string, addressId: string): Promise<any> {
    const user = await UserInfo.findById(userId);
    if (!user) {
      return null;
    }

    // 删除指定地址
    user.addresses.pull(addressId);
    await user.save();

    return removeSensitiveInfo(user.toObject());
  }

  // 设置默认地址
  async setDefaultAddress(userId: string, addressId: string): Promise<any> {
    const user = await UserInfo.findById(userId);
    if (!user) {
      return null;
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
      throw new Error('地址不存在');
    }

    await user.save();

    return removeSensitiveInfo(user.toObject());
  }
}

export default new UserInfoService();

