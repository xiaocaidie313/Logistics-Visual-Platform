import axios from 'axios';

// 🔴 请替换为你申请的【Web服务】类型的 Key
const AMAP_WEB_KEY = '2ac03f2b8d39805cd8a52c1cdd6162ae';

// 定义全国核心中转枢纽 (Hubs) - 这些依然保留，用于模拟物流节点
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

// 辅助：生成线段插值
const generateLine = (start: number[], end: number[], steps: number) => {
    const path = [];
    for (let i = 0; i <= steps; i++) {
        const lng = start[0] + (end[0] - start[0]) * (i / steps);
        const lat = start[1] + (end[1] - start[1]) * (i / steps);
        path.push([lng, lat]);
    }
    return path;
};

// 🟢 [核心修改]：异步调用高德 API 获取坐标
export const getCoordsByAddress = async (address: string): Promise<[number, number]> => {
    try {
        const url = `https://restapi.amap.com/v3/geocode/geo?key=${AMAP_WEB_KEY}&address=${encodeURIComponent(address)}`;
        const res = await axios.get(url);

        if (res.data.status === '1' && res.data.geocodes && res.data.geocodes.length > 0) {
            // API 返回格式: "116.481488,39.990464"
            const location = res.data.geocodes[0].location;
            const [lng, lat] = location.split(',').map(Number);
            return [lng, lat];
        } else {
            console.warn(`[GeoService] 地址解析失败: ${address}, 使用默认坐标`);
        }
    } catch (error) {
        console.error('[GeoService] 高德 API 请求异常:', error);
    }
    // 失败兜底：默认返回北京坐标
    return [116.40, 39.90];
};

export const extractProvince = (address: string): string => {
    // 简单提取逻辑，实际上高德 API 返回结果里也有 province 字段，也可以优化
    const provinces = ['北京市', '上海市', '广东省', '浙江省', '江苏省', '四川省', '湖北省', '山东省', '河南省', '河北省', '陕西省', '福建省', '湖南省', '安徽省', '辽宁省', '黑龙江省', '吉林省', '广西', '云南省', '贵州省', '山西省', '江西省', '天津市', '重庆市', '内蒙古', '新疆', '西藏', '宁夏', '海南'];
    for (const p of provinces) {
        if (address.includes(p)) return p;
    }
    return '其他';
};

// 🟢 [核心修改]：planRoute 必须变成 async，因为它要等待网络请求
export const planRoute = async (startAddr: string, endAddr: string) => {
    // 等待 API 返回真实坐标
    const startCoords = await getCoordsByAddress(startAddr);
    const endCoords = await getCoordsByAddress(endAddr);

    const directDist = getDist(startCoords, endCoords);

    const fullPath: number[][] = [];
    const transitStops: { stepIndex: number, hubName: string }[] = [];

    // 1. 短途直达逻辑 (距离 < 2.0)
    if (directDist < 2.0) {
        fullPath.push(...generateLine(startCoords, endCoords, 40));
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

        // 构建分段路径
        const segment1 = generateLine(startCoords, startHubCoords, 30);
        fullPath.push(...segment1);
        transitStops.push({ stepIndex: fullPath.length - 1, hubName: startHubName });

        if (startHubName !== endHubName) {
            const segment2 = generateLine(startHubCoords, endHubCoords, 50);
            fullPath.push(...segment2);
            transitStops.push({ stepIndex: fullPath.length - 1, hubName: endHubName });
        }

        const segment3 = generateLine(endHubCoords, endCoords, 30);
        fullPath.push(...segment3);
    }

    return { startCoords, endCoords, path: fullPath, transitStops };
};