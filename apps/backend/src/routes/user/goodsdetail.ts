import express from 'express';
import type { Request, Response } from 'express';
import GoodsDetail from '../../models/goodsdetail.js';
import { sendResponse } from '../../shared/sendresponse.js';

const router = express.Router();

// 获取单个订单详情
router.get('/goodsdetail/get/:id', async (req: Request, res: Response) => {
    try {
        const detailId = req.params.id;
        const detail = await GoodsDetail.findById(detailId);
        if (!detail) {
            return sendResponse(res, 404, '订单详情不存在', {});
        }
        sendResponse(res, 200, 'Success', detail);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '获取订单详情失败';
        sendResponse(res, 400, errorMessage, {});
    }
});

// 获取订单详情列表
router.get('/goodsdetail/list', async (req: Request, res: Response) => {
    try {
        const details = await GoodsDetail.find();
        sendResponse(res, 200, 'Success', details);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '获取订单详情列表失败';
        sendResponse(res, 400, errorMessage, {});
    }
});

// 根据订单ID获取订单详情
router.get('/goodsdetail/order/:orderId', async (req: Request, res: Response) => {
    try {
        const orderId = req.params.orderId;
        const details = await GoodsDetail.find({ orderId });
        sendResponse(res, 200, 'Success', details);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '获取订单详情失败';
        sendResponse(res, 400, errorMessage, {});
    }
});

export default router;

