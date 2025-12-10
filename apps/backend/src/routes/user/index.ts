import express from 'express'
import userInfoRouter from './userinfo.js';
import orderRouter from './order.js';       
import trackRouter from './track.js';
import pickupRouter from './pickup.js';
const router = express.Router();

// 挂载子路由
router.use('/', userInfoRouter);
router.use('/',orderRouter);
router.use('/',trackRouter);
router.use('/pickup', pickupRouter);


export default router;