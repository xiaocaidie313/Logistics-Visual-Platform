import TrackInfo from '../models/track.js';
import {
  emitLogisticsUpdate,
  emitLogisticsStatusChange,
  emitLogisticsTrackAdded,
} from './websocket.js';

export class TrackService {
  // 创建物流记录
  async createTrack(trackData: any): Promise<any> {
    const newTrack = new TrackInfo(trackData);
    const savedTrack = await newTrack.save();

    // 推送 WebSocket 事件
    emitLogisticsUpdate(savedTrack.logisticsNumber, savedTrack);

    return savedTrack;
  }

  // 根据id查询
  async getTrackById(id: string): Promise<any> {
    const track = await TrackInfo.findById(id);
    return track;
  }

  // 根据订单id查询
  async getTracksByOrderId(orderId: string): Promise<any> {
    const tracks = await TrackInfo.find({ orderId });
    return tracks;
  }

  // 根据物流单号查询
  async getTrackByLogisticsNumber(logisticsNumber: string): Promise<any> {
    const track = await TrackInfo.findOne({ logisticsNumber });
    return track;
  }

  // 获取物流列表
  async getTrackList(): Promise<any> {
    const tracks = await TrackInfo.find();
    return tracks;
  }

  // 更新物流
  async updateTrack(trackId: string, updateData: any): Promise<any> {
    const updatedTrack = await TrackInfo.findByIdAndUpdate(trackId, updateData, { new: true });

    if (updatedTrack) {
      // 推送 WebSocket 事件
      emitLogisticsUpdate(updatedTrack.logisticsNumber, updatedTrack);
    }

    return updatedTrack;
  }

  // 更新状态
  async updateTrackStatus(orderId: string, status: string): Promise<any> {
    const track = await TrackInfo.findOneAndUpdate(
      { orderId },
      { logisticsStatus: status },
      { new: true }
    );

    if (track) {
      // 推送 WebSocket 事件
      emitLogisticsStatusChange(track.logisticsNumber, status, track);
    }

    return track;
  }

  // 添加物流轨迹节点
  async addTrackNode(trackId: string, trackNode: any): Promise<any> {
    const track = await TrackInfo.findById(trackId);
    if (!track) {
      return null;
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

    return updatedTrack;
  }

  // 删除物流记录
  async deleteTrack(trackId: string): Promise<any> {
    const deletedTrack = await TrackInfo.findByIdAndDelete(trackId);
    return deletedTrack;
  }
}

export default new TrackService();

