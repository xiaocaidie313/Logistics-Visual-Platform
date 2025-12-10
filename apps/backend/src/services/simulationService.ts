// 车辆移动模拟服务
import TrackInfo from '../models/track.js';
import Order from '../models/order.js';
import { emitLogisticsUpdate, emitOrderStatusChange } from './websocket.js';
import { solveTSP, getDrivingRoute, generateLine } from '../utils/geoService.js';
import { generateUniquePickupCode } from '../utils/pickupCodeGenerator.js';

// 保存所有正在运行的模拟任务
const activeSimulations = new Map<string, NodeJS.Timeout>();
// 保存正在派送的集散点，防止重复派送
const dispatchingHubs = new Set<string>();

/**
 * 同步更新订单状态
 * 当物流状态变为 delivered 时，自动更新对应的订单状态
 */
const syncOrderStatusToDelivered = async (orderId: string) => {
  if (!orderId) {
    console.warn('[订单状态同步] orderId 为空，跳过同步');
    return;
  }
  
  try {
    console.log(`[订单状态同步] 开始同步订单状态，orderId: ${orderId}`);
    const order = await Order.findOne({ orderId });
    if (!order) {
      console.warn(`[订单状态同步] 未找到订单，orderId: ${orderId}`);
      return;
    }
    
    console.log(`[订单状态同步] 找到订单，当前状态: ${order.status}, orderId: ${order.orderId}`);
    
    if (order.status !== 'delivered') {
      order.status = 'delivered';
      order.deliveryTime = new Date();
      await order.save();
      emitOrderStatusChange(order.orderId, 'delivered', order);
      console.log(`[订单状态同步] 订单 ${order.orderId} 状态已更新为 delivered`);
    } else {
      console.log(`[订单状态同步] 订单 ${order.orderId} 状态已经是 delivered，跳过更新`);
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

  // 步骤 1.3: 获取路径数据（
  const path = JSON.parse(JSON.stringify(track.path));
  if (!path || !Array.isArray(path) || path.length === 0) {
    console.warn(`[模拟] ${track.id} 没有路径数据，无法启动模拟`);
    return;
  }

  const totalSteps = path.length;
  const processedStops = new Set<string>();

  // 步骤 1.4: 找到当前位置在路径中的索引
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
    // 如果是派送中且接近终点，重置到起点
    if (track.logisticsStatus === 'delivering' && index >= totalSteps - 5) {
      index = 0;
    }
  }

  console.log(`[模拟] ${track.id} (${track.isSameCity ? '同城' : '跨城'}) | 状态: ${track.logisticsStatus} | 进度: ${index}/${totalSteps}`);

  // 步骤 2: 创建定时器，每 0.5 秒执行一次（方案5：优化更新频率，让移动更流畅）
  const timer = setInterval(async () => {
    // 步骤 2.1: 检查是否到达终点
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

      // 📍 跨城逻辑 A: 干线到达 -> 等待派送
      if (track.logisticsStatus === 'shipped') {
        const now = new Date();
        const hubName = track.districtHub || "区域站点";
        const fullHubName = hubName.includes('区') ? hubName + "人民政府" : hubName;

        // 生成取件码（如果还没有）
        let pickupCode = track.pickupCode;
        let expiresAt: Date | null = null;
        
        if (!pickupCode) {
          try {
            pickupCode = await generateUniquePickupCode(async (code) => {
              const exists = await TrackInfo.findOne({ pickupCode: code });
              return !!exists;
            });
            
            // 设置过期时间（7天后）
            expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);
            
            console.log(`[取件码生成] 订单 ${track.orderId} 生成取件码: ${pickupCode}`);
            
            // 同步更新订单的取件码
            if (track.orderId) {
              await Order.findOneAndUpdate(
                { orderId: track.orderId },
                { 
                  pickupCode: pickupCode,
                  pickupCodeGeneratedAt: now,
                  pickupCodeExpiresAt: expiresAt
                }
              );
            }
          } catch (error) {
            console.error(`[取件码生成失败] 订单 ${track.orderId}:`, error);
            // 即使生成失败，也继续后续流程
          }
        } else {
          // 如果已有取件码，使用现有的过期时间
          expiresAt = track.pickupCodeExpiresAt ? new Date(track.pickupCodeExpiresAt) : null;
        }

        const log = {
          time: now,
          location: fullHubName,
          description: pickupCode 
            ? `快件已到达【${fullHubName}】集散点，取件码：${pickupCode}，等待集货派送`
            : `快件已到达【${fullHubName}】集散点，等待集货派送`,
          status: 'waiting_for_delivery',
          operator: '站点管理员'
        };

        const updateData: any = {
          logisticsStatus: 'waiting_for_delivery',
          hubArrivalTime: now,
          currentCoords: finalPoint
        };

        // 如果有取件码，添加到更新数据中
        if (pickupCode) {
          updateData.pickupCode = pickupCode;
          updateData.pickupLocation = fullHubName;
          // 只有新生成的取件码才设置生成时间和过期时间
          if (expiresAt && !track.pickupCode) {
            updateData.pickupCodeGeneratedAt = now;
            updateData.pickupCodeExpiresAt = expiresAt;
          }
        }

        const updatedTrack = await TrackInfo.findByIdAndUpdate(
          track._id,
          {
            $set: updateData,
            $push: { tracks: log }
          },
          { new: true }
        );
        emitLogisticsUpdate(track.logisticsNumber, updatedTrack);
        // 触发派送检查
        if (track.districtHub) {
          checkAndDispatch(track.districtHub);
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

    // 步骤 2.2: 检测中转站
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

    // 步骤 2.3: 获取当前位置并更新
    const currentPos = path[index];
    if (index % 5 === 0) {
      await TrackInfo.findByIdAndUpdate(track._id, { $set: { currentCoords: currentPos } });
    }
    
    // 推送位置更新
    const currentTrack = await TrackInfo.findById(track._id);
    if (currentTrack) {
      const trackDataToSend = currentTrack.toObject ? currentTrack.toObject() : currentTrack;
      trackDataToSend.currentCoords = currentPos;
      emitLogisticsUpdate(currentTrack.logisticsNumber, trackDataToSend);
    }
    index++;
  }, 1000); // 每 0.5 秒执行一次（方案5：优化更新频率）

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

/**
 * 检查并触发派送
 * 当集散点有足够订单（>=5单）或超时（10分钟）时，触发批量派送
 */
const checkAndDispatch = async (hubName: string) => {
  if (dispatchingHubs.has(hubName)) return;
  const orders = await TrackInfo.find({ districtHub: hubName, logisticsStatus: 'waiting_for_delivery' });
  if (orders.length === 0) return;

  const now = Date.now();
  // 超时派送  // 对于一个集散点 如果超过10分钟或者 超过5单 则触发派送  挨个派送 
  const TIMEOUT_THRESHOLD = 10 * 60 * 1000; // 10分钟
  const isFull = orders.length >= 5;
  const isTimeout = orders.some((o: any) => o.hubArrivalTime && (now - new Date(o.hubArrivalTime).getTime() > TIMEOUT_THRESHOLD));

  if (isFull || isTimeout) {
    console.log(`[调度] ${hubName} 触发派送 (${orders.length}单)`);
    dispatchingHubs.add(hubName);
    try {
      await dispatchBatch(hubName, orders);
    } finally {
      setTimeout(() => { dispatchingHubs.delete(hubName); }, 5000);
    }
  }
};

/**
 * 批量派送订单
 * 使用 TSP 算法优化派送路径，为每个订单生成末端派送路径
 */
const dispatchBatch = async (hubName: string, orders: any[]) => {
  const startCoords: [number, number] = [orders[0].currentCoords[0], orders[0].currentCoords[1]];
  const destinations = orders.map((o: any) => ({ 
    id: o.id, 
    coords: [o.endCoords[0], o.endCoords[1]] as [number, number] 
  }));
  const sortedOrderIds = await solveTSP(startCoords, destinations);

  let accumulatedSegment: number[][] = [];
  let prevCoords = startCoords;
  const updatesToApply: Array<{ id: string, fullPath: number[][], log: any }> = [];

  for (const orderId of sortedOrderIds) {
    let currentOrderCoords: [number, number] | null = null;
    try {
      const order = orders.find((o: any) => o.id === orderId)!;
      const trunkPath = order.path;
      const targetCoords: [number, number] = [order.endCoords[0], order.endCoords[1]];
      currentOrderCoords = targetCoords;

      // 延迟调用 api
      await new Promise(resolve => setTimeout(resolve, 1500));

      let newSegment = await getDrivingRoute(prevCoords, targetCoords);
      if (!newSegment || newSegment.length < 2) {
        newSegment = generateLine(prevCoords, targetCoords, 50);
      }

      accumulatedSegment = [...accumulatedSegment, ...newSegment];
      if (accumulatedSegment.length > 500) {
        accumulatedSegment = accumulatedSegment.filter((_, i) => i % 2 === 0);
      }

      const fullPath = [...trunkPath, ...accumulatedSegment];
      const log = {
        time: new Date(),
        location: hubName,
        description: `调度完成，快递员已从【${hubName}人民政府】出发，开始派送`,
        status: 'delivering',
        operator: '调度系统'
      };
      updatesToApply.push({ id: orderId, fullPath, log });
    } catch (err) {
      console.error(`[派送错误] ${orderId}`, err);
      if (currentOrderCoords) accumulatedSegment.push(currentOrderCoords);
    } finally {
      if (currentOrderCoords) prevCoords = currentOrderCoords;
    }
  }

  for (const update of updatesToApply) {
    const order = orders.find((o: any) => o.id === update.id);
    if (!order) continue;

    const updatedTrack = await TrackInfo.findByIdAndUpdate(
      order._id,
      {
        $set: { logisticsStatus: 'delivering', path: update.fullPath, currentCoords: startCoords },
        $push: { tracks: update.log }
      },
      { new: true }
    );
    if (updatedTrack) {
      emitLogisticsUpdate(updatedTrack.logisticsNumber, updatedTrack);
      // 启动派送模拟
      setTimeout(() => {
        startSimulation(updatedTrack);
      }, 2000);
    }
  }
};

/**
 * 启动定时检查派送任务
 * 每 10 秒检查一次所有集散点，触发符合条件的派送
 */
export const startDispatchScheduler = () => {
  setInterval(async () => {
    const hubs = await TrackInfo.distinct('districtHub', { logisticsStatus: 'waiting_for_delivery' });
    hubs.forEach((h: string) => checkAndDispatch(h));
  }, 10000);
};

