import TrackInfo from '../../models/track.js';
import Order from '../../models/order.js';
import {
  emitLogisticsUpdate,
  emitLogisticsStatusChange,
  emitLogisticsTrackAdded,
  emitOrderStatusChange,
} from '../websocket.js';
import {
  planRoute,
  extractProvince,
  extractDistrictHub,
  extractCity,
} from '../../utils/geoService.js';
import { startSimulation } from '../simulationService.js';

export class TrackService {
  // 创建物流记录
  async createTrack(trackData: any): Promise<any> {
    // 步骤 1: 提取地址信息
    const districtHub = extractDistrictHub(trackData.userAddress);
    const province = extractProvince(trackData.userAddress);

    // 步骤 2: 判断是否同城配送
    const startCity = extractCity(trackData.sendAddress);
    const endCity = extractCity(trackData.userAddress);
    const isSameCity = startCity && endCity && (startCity.includes(endCity) || endCity.includes(startCity));

    // 步骤 3: 规划配送路径（调用高德地图 API）
    const routeData = await planRoute(trackData.sendAddress, trackData.userAddress, true);

    // 步骤 4: 生成初始物流描述文案
    let startDesc = "";
    if (isSameCity) {
      // 同城配送文案
      startDesc = `同城急送，快递员已揽件，正发往【${trackData.userAddress}】`;
    } else {
      // 跨城配送文案
      let targetName = districtHub;
      if (routeData.transitStops && routeData.transitStops.length > 0 && routeData.transitStops[0]) {
        targetName = routeData.transitStops[0].hubName;
      }
      startDesc = `商家已发货，正发往【${targetName}】`;
    }

    // 步骤 5: 合并路径数据到 trackData
    const newTrackData = {
      ...trackData,
      // 确保有 id 和 orderId
      id: trackData.id || `T-${Date.now()}`,
      orderId: trackData.orderId || `ORD-${Date.now()}`,
      // 地址信息
      province,
      districtHub,
      // 同城标记
      isSameCity,
      // 坐标信息
      startCoords: routeData.startCoords,
      endCoords: routeData.endCoords,
      currentCoords: routeData.startCoords, // 初始位置在起点
      // 路径数据
      path: routeData.path,
      transitStops: routeData.transitStops,
      // 初始物流状态
      logisticsStatus: trackData.logisticsStatus || 'shipped',
      // 初始物流轨迹
      tracks: trackData.tracks || [{
        time: new Date(),
        location: trackData.sendAddress || '',
        description: startDesc,
        status: 'shipped'
      }]
    };

    // 步骤 6: 创建并保存 track
    const newTrack = new TrackInfo(newTrackData);
    const savedTrack = await newTrack.save();

    // 步骤 7: 同步更新订单状态（如果订单状态是 paid，更新为 shipped）
    if (savedTrack.orderId) {
      try {
        const order = await Order.findOne({ orderId: savedTrack.orderId });
        if (order && order.status === 'paid') {
          order.status = 'shipped';
          order.shipmentTime = new Date();
          await order.save();
          emitOrderStatusChange(order.orderId, 'shipped', order);
          console.log(`[订单状态同步] 订单 ${order.orderId} 状态已更新为 shipped`);
        }
      } catch (error) {
        console.error(`[订单状态同步失败] 订单 ${savedTrack.orderId}:`, error);
      }
    }

    // 步骤 8: 推送 WebSocket 事件
    emitLogisticsUpdate(savedTrack.logisticsNumber, savedTrack);

    // 步骤 9: 启动车辆移动模拟（自动模拟车辆沿路径移动）
    startSimulation(savedTrack);

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
      
      // 同步更新订单状态
      if (trackNode.status === 'delivered' && track.orderId) {
        try {
          const order = await Order.findOne({ orderId: track.orderId });
          if (order && order.status !== 'delivered') {
            order.status = 'delivered';
            order.deliveryTime = new Date();
            await order.save();
            emitOrderStatusChange(order.orderId, 'delivered', order);
            console.log(`[订单状态同步] 订单 ${order.orderId} 状态已更新为 delivered`);
          }
        } catch (error) {
          console.error(`[订单状态同步失败] 订单 ${track.orderId}:`, error);
        }
      }
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

