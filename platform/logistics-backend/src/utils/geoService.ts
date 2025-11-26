import axios from 'axios';

const AMAP_WEB_KEY = '2ac03f2b8d39805cd8a52c1cdd6162ae';

// 核心中转枢纽库 (用于沿途扫描)
const HUBS: Record<string, [number, number]> = {
    '华北转运中心(北京)': [116.45, 39.95],
    '华东转运中心(上海)': [121.40, 31.20],
    '华南转运中心(广州)': [113.30, 23.15],
    '华中转运中心(武汉)': [114.30, 30.60],
    '西南转运中心(成都)': [104.05, 30.65],
    '西北转运中心(西安)': [108.95, 34.25],
    '东北转运中心(沈阳)': [123.45, 41.80],
    // 可以补充更多核心节点，增加扫描命中的概率
    '华东区域枢纽(南京)': [118.78, 32.07],
    '华东区域枢纽(杭州)': [120.19, 30.26],
    '华中区域枢纽(长沙)': [112.93, 28.23],
    '华北区域枢纽(天津)': [117.20, 39.08],
    '华南区域枢纽(深圳)': [114.05, 22.54]
};

// 辅助：计算欧氏距离 (单位：度，1度≈111km)
const getDist = (p1: number[], p2: number[]) => {
    return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
};

// 辅助：直线兜底
const generateLine = (start: number[], end: number[], steps: number) => {
    const path = [];
    for (let i = 0; i <= steps; i++) {
        const lng = start[0] + (end[0] - start[0]) * (i / steps);
        const lat = start[1] + (end[1] - start[1]) * (i / steps);
        path.push([lng, lat]);
    }
    return path;
};

// 获取真实驾车路线
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
                const points = step.polyline.split(';').map((pair: string) => {
                    const [lng, lat] = pair.split(',').map(Number);
                    return [lng, lat];
                });
                fullPath.push(...points);
            }

            // 抽稀：控制总点数在 150 左右，保证仿真速度
            const totalPoints = fullPath.length;
            const TARGET_COUNT = 150;
            if (totalPoints <= TARGET_COUNT) return fullPath;
            const step = Math.ceil(totalPoints / TARGET_COUNT);
            return fullPath.filter((_, index) => index === 0 || index === totalPoints - 1 || index % step === 0);
        }
        return generateLine(start, end, 50);
    } catch (error) {
        return generateLine(start, end, 50);
    }
};

export const getCoordsByAddress = async (address: string): Promise<[number, number]> => {
    try {
        const url = `https://restapi.amap.com/v3/geocode/geo?key=${AMAP_WEB_KEY}&address=${encodeURIComponent(address)}`;
        const res = await axios.get(url);
        if (res.data.status === '1' && res.data.geocodes.length > 0) {
            const location = res.data.geocodes[0].location;
            const [lng, lat] = location.split(',').map(Number);
            return [lng, lat];
        }
    } catch (error) { console.error(error); }
    return [116.40, 39.90];
};

export const extractProvince = (address: string): string => {
    const provinces = ['北京市', '上海市', '广东省', '浙江省', '江苏省', '四川省', '湖北省', '山东省', '河南省', '河北省', '陕西省', '福建省', '湖南省', '安徽省', '辽宁省', '黑龙江省', '吉林省', '广西', '云南省', '贵州省', '山西省', '江西省', '天津市', '重庆市', '内蒙古', '新疆', '西藏', '宁夏', '海南'];
    for (const p of provinces) { if (address.includes(p)) return p; }
    return '其他';
};

// 🟢 [新增算法]：扫描路径，自动识别经过的中转站
const scanPathForHubs = (path: number[][]) => {
    const detectedStops: { stepIndex: number, hubName: string }[] = [];
    const visitedHubs = new Set<string>();

    // 遍历路径上的每个点
    path.forEach((point, index) => {
        // 检查该点是否在某个 Hub 的附近 (阈值 0.5度 ≈ 50km)
        for (const [hubName, hubCoords] of Object.entries(HUBS)) {
            if (visitedHubs.has(hubName)) continue; // 避免同一个 Hub 重复添加

            const dist = getDist(point, hubCoords);
            if (dist < 0.5) {
                detectedStops.push({ stepIndex: index, hubName });
                visitedHubs.add(hubName);
            }
        }
    });
    return detectedStops;
};

// 🟢 [核心逻辑重构]
export const planRoute = async (startAddr: string, endAddr: string) => {
    const startCoords = await getCoordsByAddress(startAddr);
    const endCoords = await getCoordsByAddress(endAddr);
    const directDist = getDist(startCoords, endCoords);

    let fullPath: number[][] = [];

    // 1. 短途 (<200km): 直接规划
    if (directDist < 2.0) {
        fullPath = await getDrivingRoute(startCoords, endCoords);
    }
    // 2. 长途: 智能规划 + 防绕路
    else {
        // A. 寻找最近的 StartHub 和 EndHub
        let startHubName = '', endHubName = '';
        let startHubCoords = startCoords, endHubCoords = endCoords;
        let minS = Infinity, minE = Infinity;

        for (const [name, coords] of Object.entries(HUBS)) {
            const d = getDist(startCoords, coords);
            if (d < minS) { minS = d; startHubCoords = coords; startHubName = name; }
        }
        for (const [name, coords] of Object.entries(HUBS)) {
            const d = getDist(endCoords, coords);
            if (d < minE) { minE = d; endHubCoords = coords; endHubName = name; }
        }

        // B. [防绕路算法] 检测 EndHub 是否导致绕路
        // 计算：StartHub -> End (直达距离) vs StartHub -> EndHub -> End (中转距离)
        const distDirect = getDist(startHubCoords, endCoords);
        const distViaHub = getDist(startHubCoords, endHubCoords) + getDist(endHubCoords, endCoords);

        // 如果中转距离比直达距离多出 30% 以上，或者 EndHub 实际上离终点比 StartHub 还远
        // 则判定为绕路，取消 EndHub，改为 StartHub 直达终点
        if (startHubName !== endHubName && (distViaHub > distDirect * 1.3 || getDist(endHubCoords, endCoords) > distDirect)) {
            console.log(`[路由优化] 检测到绕路 (${endHubName})，已自动优化为直达路线`);
            endHubName = startHubName;
            endHubCoords = startHubCoords;
        }

        // C. 构建分段路线
        // 第一段：起点 -> StartHub
        const segment1 = await getDrivingRoute(startCoords, startHubCoords);
        fullPath.push(...segment1);

        // 第二段：StartHub -> EndHub (如果不同)
        if (startHubName !== endHubName) {
            const segment2 = await getDrivingRoute(startHubCoords, endHubCoords, 2); // 距离优先
            fullPath.push(...segment2);
        }

        // 第三段：EndHub -> 终点
        const segment3 = await getDrivingRoute(endHubCoords, endCoords);
        fullPath.push(...segment3);
    }

    // 🟢 [关键步骤]：扫描生成的完整路径，自动识别沿途经过的所有中转站
    // 这样即使我们跳过了某些 Hub，或者经过了武汉但没把它设为端点，这里也能识别出来
    const transitStops = scanPathForHubs(fullPath);

    return { startCoords, endCoords, path: fullPath, transitStops };
};