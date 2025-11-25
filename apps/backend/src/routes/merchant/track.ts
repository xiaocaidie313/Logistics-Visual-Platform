// 查询跟踪物流状态
import express, {Request, Response } from 'express'
import TrackInfo  from '../../models/track.js'
import { sendResponse } from '../../shared/sendresponse.js'
import { emitLogisticsUpdate, emitLogisticsStatusChange, emitLogisticsTrackAdded } from '../../services/websocket.js'

const router  = express.Router();

// 创建物流记录
router.post('/track', async (req: Request, res: Response) => {
    try {
        const trackData = req.body;
        const newTrack = new TrackInfo(trackData);
        const savedTrack = await newTrack.save();
        
        // 推送 WebSocket 事件
        emitLogisticsUpdate(savedTrack.logisticsNumber, savedTrack);
        
        sendResponse(res, 200, 'Success', savedTrack);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '创建物流记录失败';
        sendResponse(res, 500, errorMessage, {});
    }
});

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

// 获取物流列表
router.get('/track/list', async (req: Request, res: Response) => {
    try {
        const tracks = await TrackInfo.find();
        sendResponse(res, 200, 'Success', tracks);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '获取物流列表失败';
        sendResponse(res, 500, errorMessage, {})
    }
})

// 更新物流
router.put('/track/update/:id', async (req: Request, res: Response) => {
    try {
        const trackId = req.params.id;
        const updateData = req.body;
        const updatedTrack = await TrackInfo.findByIdAndUpdate(trackId, updateData, { new: true });
        if (!updatedTrack) {
            return sendResponse(res, 404, '未找到物流信息', {})
        }
        
        // 推送 WebSocket 事件
        emitLogisticsUpdate(updatedTrack.logisticsNumber, updatedTrack);
        
        sendResponse(res, 200, 'Success', updatedTrack);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '更新物流信息失败';
        sendResponse(res, 500, errorMessage, {})
    }
})

// 跟新状态
router.put('/track/order/:orderId/status', async (req: Request, res: Response) => {
    try {
        const orderId = req.params.orderId;
        const status = req.body.status;
        const track = await TrackInfo.findOneAndUpdate(
            { orderId }, 
            { logisticsStatus: status }, 
            { new: true }
        );
        if (!track) {
            return sendResponse(res, 404, '未找到物流信息', {})
        }
        
        // 推送 WebSocket 事件
        emitLogisticsStatusChange(track.logisticsNumber, status, track);
        
        sendResponse(res, 200, 'Success', track);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '更新物流状态失败';
        sendResponse(res, 500, errorMessage, {})
    }
})

// 添加物流轨迹节点
router.post('/track/:id/track', async (req: Request, res: Response) => {
    try {
        const trackId = req.params.id;
        const trackNode = req.body; // { time, location, description, status, operator }
        
        const track = await TrackInfo.findById(trackId);
        if (!track) {
            return sendResponse(res, 404, '未找到物流信息', {})
        }
        // 添加轨迹节点
        track.tracks.push(trackNode);
        // 如果提供了状态，更新物流状态
        if (trackNode.status) {
            track.logisticsStatus = trackNode.status;
        }
        
        const updatedTrack = await track.save();
        
        // 推送 WebSocket 事件
        emitLogisticsTrackAdded(track.logisticsNumber, trackNode);
        if (trackNode.status) {
            emitLogisticsStatusChange(track.logisticsNumber, trackNode.status, updatedTrack);
        }
        
        sendResponse(res, 200, 'Success', updatedTrack);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '添加物流轨迹失败';
        sendResponse(res, 500, errorMessage, {})
    }
})

// 删除物流记录
router.delete('/track/delete/:id', async (req: Request, res: Response) => {
    try {
        const trackId = req.params.id;
        const deletedTrack = await TrackInfo.findByIdAndDelete(trackId);
        if (!deletedTrack) {
            return sendResponse(res, 404, '未找到物流信息', {})
        }
        sendResponse(res, 200, 'Success', deletedTrack);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '删除物流记录失败';
        sendResponse(res, 500, errorMessage, {})
    }
})

export default router;