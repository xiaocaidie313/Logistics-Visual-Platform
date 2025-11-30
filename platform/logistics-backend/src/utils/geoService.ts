import axios from 'axios';

const AMAP_WEB_KEY = '2ac03f2b8d39805cd8a52c1cdd6162ae'; // ⚠️ 替换你的 Key

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
    '华南区域枢纽(深圳)': [114.05, 22.54],
    '安徽区域枢纽(合肥)': [117.22, 31.82],
    '山东区域枢纽(济南)': [117.02, 36.65]
};

const getDist = (p1: number[], p2: number[]) => Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));

// 强制生成直线 (保底方案)
export const generateLine = (start: number[], end: number[], steps: number = 20) => {
    // 如果起终点极近，直接返回终点
    if (getDist(start, end) < 0.0001) return [end];

    const path: number[][] = [];
    for (let i = 0; i <= steps; i++) {
        const lng = start[0] + (end[0] - start[0]) * (i / steps);
        const lat = start[1] + (end[1] - start[1]) * (i / steps);
        path.push([lng, lat]);
    }
    return path;
};

const downsamplePath = (path: number[][], targetCount: number) => {
    if (path.length <= targetCount) return path;
    const step = Math.ceil(path.length / targetCount);
    return path.filter((_, i) => i === 0 || i === path.length - 1 || i % step === 0);
};

const appendPath = (target: number[][], segment: number[][]) => {
    if (segment.length === 0) return;
    if (target.length > 0) {
        const last = target[target.length - 1];
        const first = segment[0];
        if (getDist(last, first) < 0.0001) {
            target.push(...segment.slice(1));
            return;
        }
    }
    target.push(...segment);
};

// 提取器
export const extractDistrictHub = (address: string): string => {
    const regex = /(.+?(省|自治区|直辖市))?(.+?(市|自治州|地区))?(.+?(区|县|市))/;
    const match = address.match(regex);
    if (match) return match[0];
    const districtIndex = address.lastIndexOf('区');
    if (districtIndex > -1) return address.substring(0, districtIndex + 1);
    const countyIndex = address.lastIndexOf('县');
    if (countyIndex > -1) return address.substring(0, countyIndex + 1);
    return address.substring(0, 6);
};

export const extractProvince = (address: string): string => {
    const provinces = ['北京市', '上海市', '广东省', '浙江省', '江苏省', '四川省', '湖北省', '山东省', '河南省', '河北省', '陕西省', '福建省', '湖南省', '安徽省', '辽宁省', '黑龙江省', '吉林省', '广西', '云南省', '贵州省', '山西省', '江西省', '天津市', '重庆市', '内蒙古', '新疆', '西藏', '宁夏', '海南'];
    for (const p of provinces) { if (address.includes(p)) return p; }
    return '其他';
};

// API 交互
export const getCoordsByAddress = async (address: string): Promise<[number, number]> => {
    try {
        const url = `https://restapi.amap.com/v3/geocode/geo?key=${AMAP_WEB_KEY}&address=${encodeURIComponent(address)}`;
        const res = await axios.get(url);
        if (res.data.status === '1' && res.data.geocodes.length > 0) {
            const location = res.data.geocodes[0].location;
            const [lng, lat] = location.split(',').map(Number);
            return [lng, lat];
        }
    } catch (error) { console.error("Geocode Error", error); }
    return [116.40, 39.90];
};

// 🟢 [核心增强] 驾车路线规划 (绝不返回空数组)
export const getDrivingRoute = async (start: number[], end: number[], strategy = 0): Promise<number[][]> => {
    // 1. 距离极近，直接返回两点，防止API报错
    if (getDist(start, end) < 0.0001) {
        return [start, end];
    }

    try {
        const originStr = `${start[0].toFixed(6)},${start[1].toFixed(6)}`;
        const destinationStr = `${end[0].toFixed(6)},${end[1].toFixed(6)}`;
        const url = `https://restapi.amap.com/v3/direction/driving?key=${AMAP_WEB_KEY}&origin=${originStr}&destination=${destinationStr}&strategy=${strategy}`;
        const res = await axios.get(url);

        if (res.data.status === '1' && res.data.route && res.data.route.paths.length > 0) {
            const points: number[][] = [];
            res.data.route.paths[0].steps.forEach((step: any) => {
                step.polyline.split(';').forEach((p: string) => {
                    const [lng, lat] = p.split(',').map(Number);
                    points.push([lng, lat]);
                });
            });
            // 确保不为空
            if (points.length > 0) return points;
        }
    } catch (e) {
        console.error("API Request Failed, using fallback.");
    }

    // 🟢 降级方案：只要 API 没拿到数据，就画直线，保证路不断
    console.log("Using Fallback Line for segment");
    return generateLine(start, end);
};

const mapHubsToPath = (path: number[][], hubs: Array<{ name: string, coords: [number, number] }>) => {
    const stops: { stepIndex: number, hubName: string }[] = [];
    hubs.forEach(hub => {
        let minD = Infinity;
        let closestIndex = -1;
        path.forEach((p, i) => {
            const d = getDist(p, hub.coords);
            if (d < minD) { minD = d; closestIndex = i; }
        });
        if (closestIndex !== -1 && minD < 2.0) {
            stops.push({ stepIndex: closestIndex, hubName: hub.name });
        }
    });
    return stops.sort((a, b) => a.stepIndex - b.stepIndex);
};

// 规划路线
export const planRoute = async (startAddr: string, endAddr: string, isTrunkLine = false) => {
    const startCoords = await getCoordsByAddress(startAddr);
    const realEndCoords = await getCoordsByAddress(endAddr);

    let targetCoords: [number, number];
    let districtHubName = extractDistrictHub(endAddr);

    if (isTrunkLine) {
        const govAddress = districtHubName + "人民政府";
        const govCoords = await getCoordsByAddress(govAddress);
        if (govCoords[0] === 116.40 && govCoords[1] === 39.90 && !govAddress.includes('北京')) {
            targetCoords = realEndCoords;
        } else {
            targetCoords = govCoords;
        }
    } else {
        targetCoords = realEndCoords;
    }

    let rawFullPath: number[][] = [];

    let startHubName = '', endHubName = '';
    let startHubCoords = startCoords, endHubCoords = targetCoords;
    let minS = Infinity, minE = Infinity;

    for (const [name, coords] of Object.entries(HUBS)) {
        const d = getDist(startCoords, coords);
        if (d < minS) { minS = d; startHubCoords = coords; startHubName = name; }
    }
    for (const [name, coords] of Object.entries(HUBS)) {
        const d = getDist(targetCoords, coords);
        if (d < minE) { minE = d; endHubCoords = coords; endHubName = name; }
    }

    const segment1 = await getDrivingRoute(startCoords, startHubCoords);
    rawFullPath.push(...segment1);

    if (startHubName !== endHubName) {
        const segment2 = await getDrivingRoute(startHubCoords, endHubCoords, 2);
        appendPath(rawFullPath, segment2);
    }

    const segment3 = await getDrivingRoute(endHubCoords, targetCoords);
    appendPath(rawFullPath, segment3);

    const finalPath = downsamplePath(rawFullPath, 200);

    const hubsToMap = [
        { name: startHubName, coords: startHubCoords },
        { name: endHubName, coords: endHubCoords }
    ];
    const uniqueHubs = startHubName === endHubName ? [hubsToMap[0]] : hubsToMap;
    const transitStops = mapHubsToPath(finalPath, uniqueHubs);

    return {
        startCoords,
        endCoords: realEndCoords,
        path: finalPath,
        transitStops,
        districtHub: districtHubName
    };
};

export const solveTSP = async (startHubCoords: [number, number], destinations: Array<{ id: string, coords: [number, number] }>) => {
    const sortedOrderIds: string[] = [];
    let currentPos = startHubCoords;
    const remaining = [...destinations];

    while (remaining.length > 0) {
        let nearestIndex = -1;
        let minDist = Infinity;
        remaining.forEach((point, index) => {
            const d = getDist(currentPos, point.coords);
            if (d < minDist) { minDist = d; nearestIndex = index; }
        });
        if (nearestIndex !== -1) {
            sortedOrderIds.push(remaining[nearestIndex].id);
            currentPos = remaining[nearestIndex].coords;
            remaining.splice(nearestIndex, 1);
        } else { break; }
    }
    return sortedOrderIds;
};