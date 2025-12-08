// 车辆移动模拟服务
import TrackInfo from '../models/track.js';
import Order from '../models/order.js';
import { emitLogisticsUpdate, emitOrderStatusChange } from './websocket.js';

// 保存所有正在运行的模拟任务
const activeSimulations = new Map<string, NodeJS.Timeout>();

/**
 * 同步更新订单状态
 * 当物流状态变为 delivered 时，自动更新对应的订单状态
 */
const syncOrderStatusToDelivered = async (orderId: string) => {
  if (!orderId) return;
  
  try {
    const order = await Order.findOne({ orderId });
    if (order && order.status !== 'delivered') {
      order.status = 'delivered';
      order.deliveryTime = new Date();
      await order.save();
      emitOrderStatusChange(order.orderId, 'delivered', order);
      console.log(`[订单状态同步] 订单 ${order.orderId} 状态已更新为 delivered`);
    }
  } catch (error) {
    console.error(`[订单状态同步失败] 订单 ${orderId}:`, error);
  }
};

/**
 * 步骤 1: 启动车辆移动模拟
 * 
 * 功能：沿着 path 路径，每 1 秒移动一个点，自动更新 currentCoords
 * 
 * @param track - 物流追踪记录
 */
export const startSimulation = (track: any) => {
  // 步骤 1.1: 如果已经有模拟在运行，先停止它
  if (activeSimulations.has(track.id)) {
    const existingTimer = activeSimulations.get(track.id);
    if (existingTimer) {
      clearInterval(existingTimer);
    }
    activeSimulations.delete(track.id);
  }

  // 步骤 1.2: 如果状态是等待派送或已签收，不启动模拟
  if (track.logisticsStatus === 'waiting_for_delivery' || track.logisticsStatus === 'delivered') {
    return;
  }

  // 步骤 1.3: 获取路径数据（深拷贝，和 platform 一致）
  const path = JSON.parse(JSON.stringify(track.path));
  if (!path || !Array.isArray(path) || path.length === 0) {
    console.warn(`[模拟] ${track.id} 没有路径数据，无法启动模拟`);
    return;
  }

  const totalSteps = path.length;
  const processedStops = new Set<string>();

  // 步骤 1.4: 找到当前位置在路径中的索引（和 platform 一致）
  let index = 0;
  if (track.currentCoords && track.currentCoords.length === 2) {
    let minD = Infinity;
    let foundIndex = 0;
    for (let i = 0; i < path.length; i++) {
      const p = path[i];
      const d = Math.sqrt(Math.pow(p[0] - track.currentCoords[0], 2) + Math.pow(p[1] - track.currentCoords[1], 2));
      if (d < minD) {
        minD = d;
        foundIndex = i;
      }
    }
    index = foundIndex;
    // 如果是派送中且接近终点，重置到起点（和 platform 一致）
    if (track.logisticsStatus === 'delivering' && index >= totalSteps - 5) {
      index = 0;
    }
  }

  console.log(`[模拟] ${track.id} (${track.isSameCity ? '同城' : '跨城'}) | 状态: ${track.logisticsStatus} | 进度: ${index}/${totalSteps}`);

  // 步骤 2: 创建定时器，每 1 秒执行一次
  const timer = setInterval(async () => {
    // 步骤 2.1: 检查是否到达终点（和 platform 一致）
    if (index >= totalSteps) {
      clearInterval(timer);
      activeSimulations.delete(track.id);
      const finalPoint = path[totalSteps - 1];

      // 🟢 [同城] 直接签收，不进站
      if (track.isSameCity && track.logisticsStatus === 'shipped') {
        const currentDoc = await TrackInfo.findById(track._id);
        const isAlreadyDelivered = currentDoc?.tracks.some((t: any) => t.status === 'delivered');

        if (!isAlreadyDelivered) {
          const log = {
            time: new Date(),
            location: track.userAddress,
            description: `同城急送已送达【${track.userAddress}】，感谢您的使用`,
            status: 'delivered',
            operator: '同城骑手'
          };
          const updatedTrack = await TrackInfo.findByIdAndUpdate(
            track._id,
            {
              $set: { logisticsStatus: 'delivered', currentCoords: finalPoint },
              $push: { tracks: log }
            },
            { new: true }
          );
          emitLogisticsUpdate(track.logisticsNumber, updatedTrack);
          // 同步更新订单状态
          if (updatedTrack?.orderId) {
            await syncOrderStatusToDelivered(updatedTrack.orderId);
          }
          console.log(`[同城签收] ${track.id}`);
        }
        return;
      }

      // 📍 跨城逻辑 A: 干线到达 -> 等待（简化版，暂时直接签收）
      if (track.logisticsStatus === 'shipped') {
        const currentDoc = await TrackInfo.findById(track._id);
        const isAlreadyDelivered = currentDoc?.tracks.some((t: any) => t.status === 'delivered');

        if (!isAlreadyDelivered) {
          const log = {
            time: new Date(),
            location: track.userAddress,
            description: `快件已送达【${track.userAddress}】，感谢您的使用`,
            status: 'delivered',
            operator: '快递员'
          };
          const updatedTrack = await TrackInfo.findByIdAndUpdate(
            track._id,
            {
              $set: { logisticsStatus: 'delivered', currentCoords: finalPoint },
              $push: { tracks: log }
            },
            { new: true }
          );
          emitLogisticsUpdate(track.logisticsNumber, updatedTrack);
          // 同步更新订单状态
          if (updatedTrack?.orderId) {
            await syncOrderStatusToDelivered(updatedTrack.orderId);
          }
          console.log(`[签收] ${track.id} 结束`);
        }
      }
      // 📍 跨城逻辑 B: 末端派送 -> 签收
      else if (track.logisticsStatus === 'delivering') {
        const currentDoc = await TrackInfo.findById(track._id);
        const isAlreadyDelivered = currentDoc?.tracks.some((t: any) => t.status === 'delivered');

        if (!isAlreadyDelivered) {
          const log = {
            time: new Date(),
            location: track.userAddress,
            description: `已在【${track.userAddress}】签收，感谢您的使用，期待您的再次使用`,
            status: 'delivered',
            operator: '快递员'
          };
          const updatedTrack = await TrackInfo.findByIdAndUpdate(
            track._id,
            {
              $set: { logisticsStatus: 'delivered', currentCoords: finalPoint },
              $push: { tracks: log }
            },
            { new: true }
          );
          emitLogisticsUpdate(track.logisticsNumber, updatedTrack);
          // 同步更新订单状态
          if (updatedTrack?.orderId) {
            await syncOrderStatusToDelivered(updatedTrack.orderId);
          }
          console.log(`[签收] ${track.id} 结束`);
        }
      }
      return;
    }

    // 步骤 2.2: 检测中转站（和 platform 一致，简单直接）
    // 🟢 关键：如果是同城，强制跳过此逻辑！防止路过大桥时误触发
    if (!track.isSameCity && track.logisticsStatus === 'shipped' && track.transitStops && track.transitStops.length > 0) {
      const stop = track.transitStops.find((s: any) => Math.abs(s.stepIndex - index) <= 3);
      if (stop && !processedStops.has(stop.hubName)) {
        const currentDoc = await TrackInfo.findById(track._id);
        if (!currentDoc?.tracks.some((t: any) => t.location === stop.hubName)) {
          const hubLog = {
            time: new Date(),
            location: stop.hubName,
            description: `快件已到达【${stop.hubName}】，正发往下一站`,
            status: 'shipped',
            operator: '转运中心'
          };
          await TrackInfo.findByIdAndUpdate(track._id, { $push: { tracks: hubLog } }, { new: true });
          const updatedTrack = await TrackInfo.findById(track._id);
          if (updatedTrack) {
            emitLogisticsUpdate(updatedTrack.logisticsNumber, updatedTrack);
          }
        }
        processedStops.add(stop.hubName);
      }
    }

    // 步骤 2.3: 获取当前位置并更新（和 platform 一致）
    const currentPos = path[index];
    if (index % 5 === 0) {
      await TrackInfo.findByIdAndUpdate(track._id, { $set: { currentCoords: currentPos } });
    }
    
    // 推送位置更新（和 platform 一致，但使用我们的 WebSocket 事件）
    const currentTrack = await TrackInfo.findById(track._id);
    if (currentTrack) {
      const trackDataToSend = currentTrack.toObject ? currentTrack.toObject() : currentTrack;
      trackDataToSend.currentCoords = currentPos;
      emitLogisticsUpdate(currentTrack.logisticsNumber, trackDataToSend);
    }
    
    index++;
  }, 1000); // 每 1 秒执行一次

  // 步骤 3: 保存定时器引用，方便后续停止
  activeSimulations.set(track.id, timer);
};

/**
 * 步骤 4: 停止模拟
 * 
 * @param trackId - 物流追踪 ID
 */
export const stopSimulation = (trackId: string) => {
  const timer = activeSimulations.get(trackId);
  if (timer) {
    clearInterval(timer);
    activeSimulations.delete(trackId);
    console.log(`[模拟] 已停止 ${trackId}`);
  }
};

/**
 * 步骤 5: 检查并启动模拟（用于查询时自动启动）
 * 
 * 如果 track 的状态是 shipped 或 delivering，自动启动模拟
 */
export const checkAndStartSimulation = async (track: any) => {
  if (track && (track.logisticsStatus === 'shipped' || track.logisticsStatus === 'delivering')) {
    // 如果还没有启动模拟，则启动
    if (!activeSimulations.has(track.id)) {
      startSimulation(track);
    }
  }
};

