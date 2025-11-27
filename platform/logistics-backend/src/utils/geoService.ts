import axios from 'axios';

const AMAP_WEB_KEY = '2ac03f2b8d39805cd8a52c1cdd6162ae';

// 核心中转枢纽库
const HUBS: Record<string, [number, number]> = {
    '华北转运中心(北京)': [116.45, 39.95],
    '华东转运中心(上海)': [121.40, 31.20],
    '华南转运中心(广州)': [113.30, 23.15],
    '华中转运中心(武汉)': [114.30, 30.60],
    '西南转运中心(成都)': [104.05, 30.65],
    '西北转运中心(西安)': [108.95, 34.25],
    '东北转运中心(沈阳)': [123.45, 41.80],
    '华东区域枢纽(南京)': [118.78, 32.07],
    '华东区域枢纽(杭州)': [120.19, 30.26],
    '华中区域枢纽(长沙)': [112.93, 28.23],
    '华北区域枢纽(天津)': [117.20, 39.08],
    '华南区域枢纽(深圳)': [114.05, 22.54]
};

const getDist = (p1: number[], p2: number[]) => {
    return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
};

const generateLine = (start: number[], end: number[], steps: number) => {
    const path = [];
    for (let i = 0; i <= steps; i++) {
        const lng = start[0] + (end[0] - start[0]) * (i / steps);
        const lat = start[1] + (end[1] - start[1]) * (i / steps);
        path.push([lng, lat]);
    }
    return path;
};

// 全局统一抽稀函数
const downsamplePath = (path: number[][], targetCount: number) => {
    const total = path.length;
    if (total <= targetCount) return path;
    const step = Math.ceil(total / targetCount);
    return path.filter((_, index) => index === 0 || index === total - 1 || index % step === 0);
};

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
            return fullPath; // 返回原始点，后续统一抽稀
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

const scanPathForHubs = (path: number[][]) => {
    const detectedStops: { stepIndex: number, hubName: string }[] = [];
    const visitedHubs = new Set<string>();
    path.forEach((point, index) => {
        for (const [hubName, hubCoords] of Object.entries(HUBS)) {
            if (visitedHubs.has(hubName)) continue;
            const dist = getDist(point, hubCoords);
            if (dist < 0.5) {
                detectedStops.push({ stepIndex: index, hubName });
                visitedHubs.add(hubName);
            }
        }
    });
    return detectedStops;
};

export const planRoute = async (startAddr: string, endAddr: string) => {
    const startCoords = await getCoordsByAddress(startAddr);
    const endCoords = await getCoordsByAddress(endAddr);
    const directDist = getDist(startCoords, endCoords);

    let rawFullPath: number[][] = [];

    // 1. 收集路径点
    if (directDist < 2.0) {
        // 短途：同城或周边城市
        rawFullPath = await getDrivingRoute(startCoords, endCoords);
    } else {
        // 长途：跨区域中转
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

        // 防绕路
        const distDirect = getDist(startHubCoords, endCoords);
        const distViaHub = getDist(startHubCoords, endHubCoords) + getDist(endHubCoords, endCoords);
        if (startHubName !== endHubName && (distViaHub > distDirect * 1.3 || getDist(endHubCoords, endCoords) > distDirect)) {
            endHubName = startHubName;
            endHubCoords = startHubCoords;
        }

        const segment1 = await getDrivingRoute(startCoords, startHubCoords);
        rawFullPath.push(...segment1);

        if (startHubName !== endHubName) {
            const segment2 = await getDrivingRoute(startHubCoords, endHubCoords, 2);
            rawFullPath.push(...segment2);
        }

        const segment3 = await getDrivingRoute(endHubCoords, endCoords);
        rawFullPath.push(...segment3);
    }

    // 2. 全局抽稀
    const finalPath = downsamplePath(rawFullPath, 150);

    // 3. 🟢 [关键修复]：中转站扫描策略
    // 只有当距离较远（> 2.0，约200公里）时，才扫描沿途的中转站
    // 如果是同城短途（< 2.0），强制清空中转列表，不再触发“到达XX枢纽”的日志
    let transitStops: { stepIndex: number, hubName: string }[] = [];
    if (directDist >= 2.0) {
        transitStops = scanPathForHubs(finalPath);
    }

    return { startCoords, endCoords, path: finalPath, transitStops };
};