/**
 * 取件码生成工具
 */

/**
 * 生成6位数字取件码
 * @returns 6位数字字符串，如 "123456"
 */
export const generatePickupCode = (): string => {
  // 生成 100000-999999 之间的随机数
  const code = Math.floor(100000 + Math.random() * 900000);
  return code.toString();
};

/**
 * 生成唯一取件码（检查数据库中是否已存在）
 * @param checkExists - 检查函数，返回 true 表示已存在
 * @returns 唯一的6位数字取件码
 */
export const generateUniquePickupCode = async (
  checkExists: (code: string) => Promise<boolean>
): Promise<string> => {
  let code = generatePickupCode();
  let attempts = 0;
  const maxAttempts = 100; // 最多尝试100次

  while (await checkExists(code) && attempts < maxAttempts) {
    code = generatePickupCode();
    attempts++;
  }

  if (attempts >= maxAttempts) {
    throw new Error('无法生成唯一取件码，请重试');
  }

  return code;
};

/**
 * 验证取件码格式
 * @param code - 取件码
 * @returns 是否为有效的6位数字
 */
export const validatePickupCode = (code: string): boolean => {
  return /^\d{6}$/.test(code);
};

