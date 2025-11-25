import axios from 'axios';

// 🔴 请替换为你申请的【Web服务】类型的 Key
const AMAP_WEB_KEY = '2ac03f2b8d39805cd8a52c1cdd6162ae';

// 定义全国核心中转枢纽 (Hubs)
const HUBS: Record<string, [number, number]> = {
    '华北转运中心(北京)': [116.45, 39.95],
    '华东转运中心(上海)': [121.40, 31.20],
    '华南转运中心(广州)': [113.30, 23.15],
    '华中转运中心(武汉)': [114.30, 30.60],
    '西南转运中心(成都)': [104.05, 30.65],
    '西北转运中心(西安)': [108.95, 34.25],
    '东北转运中心(沈阳)': [123.45, 41.80]
};

// 辅助：计算距离
const getDist = (p1: number[], p2: number[]) => {
    return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
};

// 辅助：生成直线插值 (作为 API 请求失败时的兜底方案)
const generateLine = (start: number[], end: number[], steps: number) => {
    const path = [];
    for (let i = 0; i <= steps; i++) {
        const lng = start[0] + (end[0] - start[0]) * (i / steps);
        const lat = start[1] + (end[1] - start[1]) * (i / steps);
        path.push([lng, lat]);
    }
    return path;
};


// strategy: 0 (速度优先), 2 (距离优先)
const getDrivingRoute = async (start: number[], end: number[], strategy = 0): Promise<number[][]> => {
    try {
        const originStr = `${start[0].toFixed(6)},${start[1].toFixed(6)}`;
        const destinationStr = `${end[0].toFixed(6)},${end[1].toFixed(6)}`;

        const url = `https://restapi.amap.com/v3/direction/driving?key=${AMAP_WEB_KEY}&origin=${originStr}&destination=${destinationStr}&strategy=${strategy}`;

        const res = await axios.get(url);

        if (res.data.status === '1' && res.data.route && res.data.route.paths.length > 0) {
            const routePath = res.data.route.paths[0];
            const fullPath: number[][] = [];

            for (const step of routePath.steps) {
                const polylineStr = step.polyline;
                const points = polylineStr.split(';').map((pair: string) => {
                    const [lng, lat] = pair.split(',').map(Number);
                    return [lng, lat];
                });
                fullPath.push(...points);
            }

            // --- 动态抽稀算法 ---
            // 目标：不管路有多长，每一段路线（比如北京->上海Hub）最多只保留约 80 个点
            // 这样可以保证仿真时间控制在 80 * 2s = 160s (2.5分钟) 左右

            const totalPoints = fullPath.length;
            const TARGET_COUNT = 80; // 目标点数

            if (totalPoints <= TARGET_COUNT) {
                return fullPath; // 点数很少（短途），直接返回
            }

            // 计算步长：例如 5000 个点，目标 80，则 step ≈ 62
            // 这意味着每 62 个点取 1 个
            const step = Math.ceil(totalPoints / TARGET_COUNT);

            return fullPath.filter((_, index) =>
                // 保留起点、终点、以及符合步长的点
                index === 0 || index === totalPoints - 1 || index % step === 0
            );

        } else {
            console.warn('[GeoService] 路径规划失败，降级为直线');
            // 失败时也减少点数，避免直线走太慢
            return generateLine(start, end, 50);
        }
    } catch (error) {
        console.error('[GeoService] 高德 API 请求异常:', error);
        return generateLine(start, end, 50);
    }
};

// 异步调用高德 API 获取坐标 (保持不变)
export const getCoordsByAddress = async (address: string): Promise<[number, number]> => {
    try {
        const url = `https://restapi.amap.com/v3/geocode/geo?key=${AMAP_WEB_KEY}&address=${encodeURIComponent(address)}`;
        const res = await axios.get(url);

        if (res.data.status === '1' && res.data.geocodes && res.data.geocodes.length > 0) {
            const location = res.data.geocodes[0].location;
            const [lng, lat] = location.split(',').map(Number);
            return [lng, lat];
        } else {
            console.warn(`[GeoService] 地址解析失败: ${address}, 使用默认坐标`);
        }
    } catch (error) {
        console.error('[GeoService] 高德 API 请求异常:', error);
    }
    return [116.40, 39.90];
};

export const extractProvince = (address: string): string => {
    const provinces = ['北京市', '上海市', '广东省', '浙江省', '江苏省', '四川省', '湖北省', '山东省', '河南省', '河北省', '陕西省', '福建省', '湖南省', '安徽省', '辽宁省', '黑龙江省', '吉林省', '广西', '云南省', '贵州省', '山西省', '江西省', '天津市', '重庆市', '内蒙古', '新疆', '西藏', '宁夏', '海南'];
    for (const p of provinces) {
        if (address.includes(p)) return p;
    }
    return '其他';
};

// 🟢 [核心修改]：planRoute 使用 getDrivingRoute 生成真实道路轨迹
export const planRoute = async (startAddr: string, endAddr: string) => {
    const startCoords = await getCoordsByAddress(startAddr);
    const endCoords = await getCoordsByAddress(endAddr);

    const directDist = getDist(startCoords, endCoords);

    const fullPath: number[][] = [];
    const transitStops: { stepIndex: number, hubName: string }[] = [];

    // 1. 短途直达逻辑 (距离 < 2.0)
    if (directDist < 2.0) {
        // 使用真实驾车路线
        const route = await getDrivingRoute(startCoords, endCoords);
        fullPath.push(...route);
    }
    // 2. 长途逻辑 (经过 Hub)
    else {
        // 找到离起点最近的 Hub
        let startHubName = '';
        let startHubCoords = startCoords;
        let minSDist = Infinity;
        for (const [name, coords] of Object.entries(HUBS)) {
            const d = getDist(startCoords, coords);
            if (d < minSDist) { minSDist = d; startHubCoords = coords; startHubName = name; }
        }

        // 找到离终点最近的 Hub
        let endHubName = '';
        let endHubCoords = endCoords;
        let minEDist = Infinity;
        for (const [name, coords] of Object.entries(HUBS)) {
            const d = getDist(endCoords, coords);
            if (d < minEDist) { minEDist = d; endHubCoords = coords; endHubName = name; }
        }

        // 构建分段路径 (每一段都调用 API 获取真实路线)

        // 第一段：起点 -> 起点Hub
        const segment1 = await getDrivingRoute(startCoords, startHubCoords);
        fullPath.push(...segment1);
        transitStops.push({ stepIndex: fullPath.length - 1, hubName: startHubName });

        if (startHubName !== endHubName) {
            // 第二段：Hub -> Hub (长途干线，使用策略2：距离优先)
            const segment2 = await getDrivingRoute(startHubCoords, endHubCoords, 2);
            fullPath.push(...segment2);
            transitStops.push({ stepIndex: fullPath.length - 1, hubName: endHubName });
        }

        // 第三段：终点Hub -> 终点
        const segment3 = await getDrivingRoute(endHubCoords, endCoords);
        fullPath.push(...segment3);
    }

    return { startCoords, endCoords, path: fullPath, transitStops };
};