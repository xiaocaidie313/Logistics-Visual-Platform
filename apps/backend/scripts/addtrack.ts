// 添加物流追踪记录脚本
import mongoose from 'mongoose';
import TrackInfo from '../src/models/track.js';
import Order from '../src/models/order.js';
import {
  planRoute,
  extractProvince,
  extractDistrictHub,
  extractCity,
} from '../src/utils/geoService.js';

const MONGODB_URI = "mongodb://lms:123lms@47.109.143.184:27017/logistics";

// 物流公司列表
const LOGISTICS_COMPANIES = [
  '顺丰速运',
  '京东物流',
  '中通快递',
  '圆通速递',
  '申通快递',
  '韵达快递',
  '极兔快递'
];

// 物流公司对应的单号前缀
const LOGISTICS_PREFIX: Record<string, string> = {
  '顺丰速运': 'SF',
  '京东物流': 'JD',
  '中通快递': 'ZTO',
  '圆通速递': 'YTO',
  '申通快递': 'STO',
  '韵达快递': 'YD',
  '极兔快递': 'J&T'
};

// 随机选择物流公司
const getRandomLogisticsCompany = (): string => {
  const randomIndex = Math.floor(Math.random() * LOGISTICS_COMPANIES.length);
  return LOGISTICS_COMPANIES[randomIndex];
};

// 生成物流单号（根据物流公司生成对应前缀）
const generateLogisticsNumber = (logisticsCompany: string): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const prefix = LOGISTICS_PREFIX[logisticsCompany] || 'SF';
  return `${prefix}${timestamp}${random}`;
};

// 生成 track ID
const generateTrackId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `T-${timestamp}${random}`;
};

// 直接创建 track（不调用 WebSocket，用于脚本环境）
const createTrackDirectly = async (trackData: any): Promise<any> => {
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
    startDesc = `同城急送，快递员已揽件，正发往【${trackData.userAddress}】`;
  } else {
    let targetName = districtHub;
    if (routeData.transitStops && routeData.transitStops.length > 0 && routeData.transitStops[0]) {
      targetName = routeData.transitStops[0].hubName;
    }
    startDesc = `商家已发货，正发往【${targetName}】`;
  }

  // 步骤 5: 合并路径数据到 trackData
  const newTrackData = {
    ...trackData,
    id: trackData.id || `T-${Date.now()}`,
    orderId: trackData.orderId || `ORD-${Date.now()}`,
    province,
    districtHub,
    isSameCity,
    startCoords: routeData.startCoords,
    endCoords: routeData.endCoords,
    currentCoords: routeData.startCoords,
    path: routeData.path,
    transitStops: routeData.transitStops,
    logisticsStatus: trackData.logisticsStatus || 'shipped',
    tracks: trackData.tracks || [{
      time: new Date(),
      location: trackData.sendAddress || '',
      description: startDesc,
      status: 'shipped'
    }]
  };

  // 步骤 6: 创建并保存 track（不调用 WebSocket）
  const newTrack = new TrackInfo(newTrackData);
  const savedTrack = await newTrack.save();

  return savedTrack;
};

// 从订单创建 track
const createTrackFromOrder = async (orderId: string) => {
  try {
    // 连接数据库
    await mongoose.connect(MONGODB_URI);
    console.log('=====数据库连接成功=====');

    // 1. 查找订单
    const order = await Order.findOne({ orderId });
    if (!order) {
      console.log(`错误：找不到订单 ID: ${orderId}`);
      return;
    }
    console.log(`找到订单: ${order.orderId}`);

    // 2. 检查是否已有 track
    const existingTrack = await TrackInfo.findOne({ orderId: order.orderId });
    if (existingTrack) {
      console.log(`警告：订单 ${orderId} 已有物流记录，ID: ${existingTrack.id}`);
      console.log('是否继续创建新的物流记录？(y/n)');
      // 这里简化处理，直接返回
      return;
    }

    // 3. 随机选择物流公司
    const logisticsCompany = getRandomLogisticsCompany();

    // 4. 准备 track 数据
    const trackData = {
      id: generateTrackId(),
      orderId: order.orderId,
      logisticsCompany: logisticsCompany,
      logisticsNumber: generateLogisticsNumber(logisticsCompany),
      logisticsStatus: 'shipped',
      orderTime: order.ordertime || new Date(),
      sendAddress: order.sendaddress || order.senderAddress || '北京市海淀区中关村大街1号',
      userAddress: order.useraddress || order.shippingAddress?.fullAddress || '广东省深圳市南山区科技园',
    };

    console.log('=====开始创建物流记录=====');
    console.log('订单ID:', trackData.orderId);
    console.log('物流公司:', trackData.logisticsCompany);
    console.log('物流单号:', trackData.logisticsNumber);
    console.log('发货地址:', trackData.sendAddress);
    console.log('收货地址:', trackData.userAddress);
    console.log('正在规划路径...（这可能需要几秒钟）');

    // 5. 直接创建 track（不调用 WebSocket）
    const savedTrack = await createTrackDirectly(trackData);

    console.log('=====物流记录创建成功=====');
    console.log('Track ID:', savedTrack.id);
    console.log('物流单号:', savedTrack.logisticsNumber);
    console.log('订单ID:', savedTrack.orderId);
    console.log('物流状态:', savedTrack.logisticsStatus);
    console.log('是否同城:', savedTrack.isSameCity);
    console.log('路径点数:', savedTrack.path?.length || 0);
    console.log('起点坐标:', savedTrack.startCoords);
    console.log('终点坐标:', savedTrack.endCoords);
    console.log('当前坐标:', savedTrack.currentCoords);

    await mongoose.disconnect();
    console.log('=====数据库连接已关闭=====');
  } catch (error: unknown) {
    console.error('错误:', error);
    console.log('=====物流记录创建失败=====');
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
};

// 手动创建 track（指定地址）
const createTrackManually = async (
  orderId: string,
  sendAddress: string,
  userAddress: string,
  logisticsCompany?: string
) => {
  try {
    // 连接数据库
    await mongoose.connect(MONGODB_URI);
    console.log('=====数据库连接成功=====');

    // 如果没有指定物流公司，则随机选择
    const selectedCompany = logisticsCompany || getRandomLogisticsCompany();

    // 准备 track 数据
    const trackData = {
      id: generateTrackId(),
      orderId: orderId,
      logisticsCompany: selectedCompany,
      logisticsNumber: generateLogisticsNumber(selectedCompany),
      logisticsStatus: 'shipped',
      orderTime: new Date(),
      sendAddress: sendAddress,
      userAddress: userAddress,
    };

    console.log('=====开始创建物流记录=====');
    console.log('订单ID:', trackData.orderId);
    console.log('发货地址:', trackData.sendAddress);
    console.log('收货地址:', trackData.userAddress);
    console.log('物流公司:', trackData.logisticsCompany);
    console.log('正在规划路径...（这可能需要几秒钟）');

    // 直接创建 track（不调用 WebSocket）
    const savedTrack = await createTrackDirectly(trackData);

    console.log('=====物流记录创建成功=====');
    console.log('Track ID:', savedTrack.id);
    console.log('物流单号:', savedTrack.logisticsNumber);
    console.log('订单ID:', savedTrack.orderId);
    console.log('物流状态:', savedTrack.logisticsStatus);
    console.log('是否同城:', savedTrack.isSameCity);
    console.log('路径点数:', savedTrack.path?.length || 0);
    console.log('起点坐标:', savedTrack.startCoords);
    console.log('终点坐标:', savedTrack.endCoords);
    console.log('当前坐标:', savedTrack.currentCoords);

    await mongoose.disconnect();
    console.log('=====数据库连接已关闭=====');
  } catch (error: unknown) {
    console.error('错误:', error);
    console.log('=====物流记录创建失败=====');
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
};

// 从现有订单批量创建 track
const createTracksFromOrders = async (status?: string, limit?: number) => {
  try {
    // 连接数据库
    await mongoose.connect(MONGODB_URI);
    console.log('=====数据库连接成功=====');

    // 查找订单（可选：按状态筛选）
    const query = status ? { status } : {};
    const queryBuilder = Order.find(query);
    
    // 如果指定了限制数量，则应用限制
    if (limit) {
      queryBuilder.limit(limit);
    }
    
    const orders = await queryBuilder.exec();

    if (orders.length === 0) {
      console.log('没有找到订单');
      await mongoose.disconnect();
      return;
    }

    console.log(`找到 ${orders.length} 个订单，开始创建物流记录...`);
    console.log('');

    let successCount = 0;
    let failCount = 0;
    let skipCount = 0;

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      try {
        // 检查是否已有 track
        const existingTrack = await TrackInfo.findOne({ orderId: order.orderId });
        if (existingTrack) {
          console.log(`[${i + 1}/${orders.length}] 跳过订单 ${order.orderId}：已有物流记录`);
          skipCount++;
          continue;
        }

        // 获取地址信息（优先使用 senderAddress，因为它更准确）
        // 注意：order 中可能有 sendaddress 和 senderAddress 两个字段，优先使用 senderAddress
        const sendAddress = order.senderAddress || order.sendaddress || '';
        const userAddress = order.useraddress || order.shippingAddress?.fullAddress || '';

        // 检查地址是否有效
        if (!sendAddress || !userAddress) {
          console.log(`[${i + 1}/${orders.length}] 跳过订单 ${order.orderId}：地址信息不完整`);
          console.log(`  发货地址: ${sendAddress || '(缺失)'}`);
          console.log(`  收货地址: ${userAddress || '(缺失)'}`);
          skipCount++;
          continue;
        }

        // 随机选择物流公司
        const logisticsCompany = getRandomLogisticsCompany();

        // 准备 track 数据
        const trackData = {
          id: generateTrackId(),
          orderId: order.orderId,
          logisticsCompany: logisticsCompany,
          logisticsNumber: generateLogisticsNumber(logisticsCompany),
          logisticsStatus: 'shipped',
          orderTime: order.ordertime || new Date(),
          sendAddress: sendAddress,
          userAddress: userAddress,
        };

        console.log(`[${i + 1}/${orders.length}] 正在为订单 ${order.orderId} 创建物流记录...`);
        console.log(`  物流公司: ${logisticsCompany}`);
        console.log(`  物流单号: ${trackData.logisticsNumber}`);
        console.log(`  发货地址: ${sendAddress}`);
        console.log(`  收货地址: ${userAddress}`);
        console.log(`  正在规划路径...（这可能需要几秒钟）`);

        // 直接创建 track（不调用 WebSocket）
        const savedTrack = await createTrackDirectly(trackData);
        console.log(`  ✓ 创建成功！Track ID: ${savedTrack.id}`);
        console.log(`  路径点数: ${savedTrack.path?.length || 0}, 是否同城: ${savedTrack.isSameCity ? '是' : '否'}`);
        console.log('');
        successCount++;

        // 添加延迟，避免 API 调用过快（高德地图 API 有频率限制）
        if (i < orders.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`  ✗ 订单 ${order.orderId} 创建失败: ${errorMessage}`);
        console.log('');
        failCount++;
      }
    }

    console.log('=====批量创建完成=====');
    console.log(`总计: ${orders.length} 个订单`);
    console.log(`成功: ${successCount} 个`);
    console.log(`失败: ${failCount} 个`);
    console.log(`跳过: ${skipCount} 个（已有记录或地址不完整）`);

    await mongoose.disconnect();
    console.log('=====数据库连接已关闭=====');
  } catch (error: unknown) {
    console.error('错误:', error);
    console.log('=====批量创建失败=====');
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
};

// 主函数
const main = async () => {
  // 从命令行参数获取模式
  const args = process.argv.slice(2);
  const mode = args[0];

  if (mode === 'order' && args[1]) {
    // 模式1: 从订单ID创建
    // 用法: tsx scripts/addtrack.ts order ORD123456
    await createTrackFromOrder(args[1]);
  } else if (mode === 'manual' && args[1] && args[2]) {
    // 模式2: 手动创建（指定地址）
    // 用法: tsx scripts/addtrack.ts manual ORD123456 "北京市海淀区" "广东省深圳市"
    const orderId = args[1];
    const sendAddress = args[2];
    const userAddress = args[3] || '广东省深圳市南山区科技园';
    const logisticsCompany = args[4] || '顺丰速运';
    await createTrackManually(orderId, sendAddress, userAddress, logisticsCompany);
  } else if (mode === 'batch') {
    // 模式3: 批量创建（从现有订单）
    // 用法: tsx scripts/addtrack.ts batch [订单状态] [限制数量]
    const status = args[1]; // 可选：订单状态筛选
    const limit = args[2] ? parseInt(args[2], 10) : undefined; // 可选：限制数量
    await createTracksFromOrders(status, limit);
  } else {
    // 默认模式：批量创建所有订单的 track
    console.log('=====批量创建所有订单的物流记录=====');
    console.log('（提示：可以使用 "tsx scripts/addtrack.ts batch [状态] [数量]" 来筛选订单）');
    console.log('');
    await createTracksFromOrders();
  }
};

// 执行主函数
console.log('=====开始执行物流追踪记录生成脚本=====');
main().catch((error) => {
  console.error('未捕获的错误:', error);
  process.exit(1);
});

