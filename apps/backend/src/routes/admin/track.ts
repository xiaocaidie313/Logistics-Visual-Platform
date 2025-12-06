import express from 'express';
import { auth } from '../../utils/index.js';
import TrackController from '../../controllers/admin/trackController.js';

const router = express.Router();

// 创建物流记录
router.post('/track', auth, TrackController.createTrack.bind(TrackController));

// 根据id查询
router.get('/track/:id', auth, TrackController.getTrackById.bind(TrackController));

// 根据订单id查询
router.get('/track/order/:orderId', auth, TrackController.getTracksByOrderId.bind(TrackController));

// 根据物流单号查询
router.get('/track/logistics/:logisticsNumber', auth, TrackController.getTrackByLogisticsNumber.bind(TrackController));

// 获取物流列表
router.get('/track/list', auth, TrackController.getTrackList.bind(TrackController));

// 更新物流
router.put('/track/update/:id', auth, TrackController.updateTrack.bind(TrackController));

// 更新状态
router.put('/track/order/:orderId/status', auth, TrackController.updateTrackStatus.bind(TrackController));

// 添加物流轨迹节点
router.post('/track/:id/track', auth, TrackController.addTrackNode.bind(TrackController));

// 删除物流记录
router.delete('/track/delete/:id', auth, TrackController.deleteTrack.bind(TrackController));

export default router;
