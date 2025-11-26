import express from 'express'
import userinfoRouter from './userinfo.js';
import orderRouter from './order.js';       
import trackRouter from './track.js';
const router = express.Router();

// 挂载子路由
router.use('/', userinfoRouter);
router.use('/',orderRouter);
router.use('/',trackRouter);


export default router;