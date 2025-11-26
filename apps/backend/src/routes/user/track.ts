// 查询跟踪物流状态（用户端只读）
import express, {Request, Response } from 'express'
import TrackInfo  from '../../models/track.js'
import { sendResponse } from '../../utils/index.js'

const router  = express.Router();

// 根据id查询
router.get('/track/:id', async (req: Request, res: Response) => {
    try {
        const track = await TrackInfo.findById(req.params.id);
        if (!track) {
            return sendResponse(res, 404, '未找到物流信息', {})
        }
        sendResponse(res, 200, 'Success', track);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '获取物流信息失败';
        sendResponse(res, 500, errorMessage, {})
    }
})

// 根据订单id查询
router.get('/track/order/:orderId', async (req: Request, res: Response) => {
    try {
        const orderId = req.params.orderId;
        const tracks = await TrackInfo.find({ orderId });
        if (!tracks || tracks.length === 0) {
            return sendResponse(res, 404, '未找到物流信息', {})
        }
        sendResponse(res, 200, 'Success', tracks);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '获取物流信息失败';
        sendResponse(res, 500, errorMessage, {})
    }
})

// 根据物流单号查询
router.get('/track/logistics/:logisticsNumber', async (req: Request, res: Response) => {
    try {
        const logisticsNumber = req.params.logisticsNumber;
        const track = await TrackInfo.findOne({ logisticsNumber });
        if (!track) {
            return sendResponse(res, 404, '未找到物流信息', {})
        }
        sendResponse(res, 200, 'Success', track);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '获取物流信息失败';
        sendResponse(res, 500, errorMessage, {})
    }
})

export default router;