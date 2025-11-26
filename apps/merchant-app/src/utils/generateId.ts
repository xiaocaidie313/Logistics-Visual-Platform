// 生成唯一用户ID的工具函数
export const generateUserId = (): string => {
  const timestamp = Date.now().toString(36); // 时间戳转36进制
  const randomStr = Math.random().toString(36).substring(2, 8); // 随机字符串
  return `user_${timestamp}_${randomStr}`;
};
