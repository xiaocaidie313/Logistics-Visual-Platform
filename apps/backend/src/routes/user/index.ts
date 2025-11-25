import express from 'express'
import goodsdetailRouter from './goodsdetail.js';
import userinfoRouter from './userinfo.js';
import goodsRouter from './goods.js';       
import trackRouter from './track.js';
const router = express.Router();

// 挂载子路由
router.use('/', goodsdetailRouter);
router.use('/', userinfoRouter);
router.use('/',goodsRouter);
router.use('/',trackRouter);


export default router;