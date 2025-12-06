import TrackInfo from '../../models/track.js';

export class UserTrackService {
  // 根据id查询（用户端只读）
  async getTrackById(id: string): Promise<any> {
    const track = await TrackInfo.findById(id);
    return track;
  }

  // 根据订单id查询（用户端只读）
  async getTracksByOrderId(orderId: string): Promise<any> {
    const tracks = await TrackInfo.find({ orderId });
    return tracks;
  }

  // 根据物流单号查询（用户端只读）
  async getTrackByLogisticsNumber(logisticsNumber: string): Promise<any> {
    const track = await TrackInfo.findOne({ logisticsNumber });
    return track;
  }
}

export default new UserTrackService();

