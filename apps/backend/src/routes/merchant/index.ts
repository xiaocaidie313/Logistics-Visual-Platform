import express from 'express';

import userinfoRouter from './userinfo.js';
import ordersRouter from './orders.js';
import trackRouter from './track.js';
import productRouter from './product.js';
const router = express.Router();

// 挂载子路由
router.use('/', userinfoRouter);
router.use('/', ordersRouter);
router.use('/', trackRouter);
router.use('/', productRouter);
export default router;