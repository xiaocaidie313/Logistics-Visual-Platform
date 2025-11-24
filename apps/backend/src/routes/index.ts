import express from 'express';
import user from './user/index.js';
import merchant from './merchant/index.js';

const router = express.Router();

// 挂载子路由
router.use('/user', user);
router.use('/merchant', merchant);

export default router;