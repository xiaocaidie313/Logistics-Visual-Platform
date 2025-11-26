import express from 'express'
import userInfoRouter from './userInfo.js';
import orderRouter from './order.js';       
import trackRouter from './track.js';
const router = express.Router();

// 挂载子路由
router.use('/', userInfoRouter);
router.use('/',orderRouter);
router.use('/',trackRouter);


export default router;