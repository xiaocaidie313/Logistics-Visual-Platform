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

export const generateLine = (start: number[], end: number[], steps: number = 20) => {
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
    if (!segment || segment.length === 0) return;
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

// 🟢 [增强版] 提取城市名 (忽略省份前缀)
export const extractCity = (address: string): string => {
    if (!address) return "";
    // 1. 去掉 "江苏省", "xx自治区" 等前缀，只取后面的部分
    // 这里的正则意思是：找到最后一个'省'或'自治区'，取其后面的内容
    let cleanAddr = address;
    if (address.includes('省')) cleanAddr = address.split('省')[1];
    else if (address.includes('自治区')) cleanAddr = address.split('自治区')[1];

    // 2. 提取市名
    const match = cleanAddr.match(/^.+?(市|自治州|地区|盟)/);
    if (match) return match[0];

    // 3. 如果没匹配到（可能是直辖市），尝试直接匹配
    const directMatch = address.match(/^.+?(市)/);
    return directMatch ? directMatch[0] : "";
};

export const extractDistrictHub = (address: string): string => {
    const regex = /(.+?(省|自治区|直辖市))?(.+?(市|自治州|地区))?(.+?(区|县|市))/;
    const match = address.match(regex);
    if (match) return match[0];
    return address.substring(0, 6);
};

export const extractProvince = (address: string): string => {
    const provinces = ['北京市', '上海市', '广东省', '浙江省', '江苏省', '四川省', '湖北省', '山东省', '河南省', '河北省', '陕西省', '福建省', '湖南省', '安徽省', '辽宁省', '黑龙江省', '吉林省', '广西', '云南省', '贵州省', '山西省', '江西省', '天津市', '重庆市', '内蒙古', '新疆', '西藏', '宁夏', '海南'];
    for (const p of provinces) { if (address.includes(p)) return p; }
    return '其他';
};

export const getCoordsByAddress = async (address: string): Promise<[number, number]> => {
    try {
        const url = `https://restapi.amap.com/v3/geocode/geo?key=${AMAP_WEB_KEY}&address=${encodeURIComponent(address)}`;
        console.log(`[Geo] 请求地址解析: ${address}`);
        const res = await axios.get(url, { timeout: 10000 });
        if (res.data.status === '1' && res.data.geocodes && res.data.geocodes.length > 0) {
            const location = res.data.geocodes[0].location;
            const [lng, lat] = location.split(',').map(Number);
            console.log(`[Geo] 地址解析成功: ${address} -> [${lng}, ${lat}]`);
            return [lng, lat];
        } else {
            console.warn(`[Geo] 地址解析失败: status=${res.data.status}, info=${res.data.info || 'unknown'}`);
        }
    } catch (error: any) {
        console.error(`[Geo] 地址解析 API 调用失败:`, error.message || error);
        if (error.response) {
            console.error(`[Geo] API 响应:`, error.response.data);
        }
    }
    console.warn(`[Geo] 使用默认坐标 [116.40, 39.90] (北京)`);
    return [116.40, 39.90];
};

export const getDrivingRoute = async (start: number[], end: number[], strategy = 0): Promise<number[][]> => {
    if (getDist(start, end) < 0.0001) return [start, end];

    try {
        const originStr = `${start[0].toFixed(6)},${start[1].toFixed(6)}`;
        const destinationStr = `${end[0].toFixed(6)},${end[1].toFixed(6)}`;
        const url = `https://restapi.amap.com/v3/direction/driving?key=${AMAP_WEB_KEY}&origin=${originStr}&destination=${destinationStr}&strategy=${strategy}`;
        
        console.log(`[Geo] 请求路径规划: ${originStr} -> ${destinationStr}, strategy=${strategy}`);
        
        const res = await axios.get(url, { timeout: 10000 }); // 增加超时时间到 10 秒

        if (res.data.status === '1' && res.data.route && res.data.route.paths.length > 0) {
            const points: number[][] = [];
            res.data.route.paths[0].steps.forEach((step: any) => {
                if (step.polyline) {
                    step.polyline.split(';').forEach((p: string) => {
                        const [lng, lat] = p.split(',').map(Number);
                        if (!isNaN(lng) && !isNaN(lat)) {
                            points.push([lng, lat]);
                        }
                    });
                }
            });
            if (points.length > 0) {
                console.log(`[Geo] 成功获取路径，共 ${points.length} 个点`);
                return points;
            } else {
                console.warn(`[Geo] API 返回路径为空，使用直线路径`);
            }
        } else {
            console.warn(`[Geo] API 返回状态异常: status=${res.data.status}, info=${res.data.info || 'unknown'}`);
        }
    } catch (e: any) {
        console.error(`[Geo] 路径规划 API 调用失败:`, e.message || e);
        if (e.response) {
            console.error(`[Geo] API 响应:`, e.response.data);
        }
    }
    
    // 如果 API 调用失败，使用直线路径（但增加点数，让路径更平滑）
    console.log(`[Geo] 使用直线路径作为备选方案`);
    return generateLine(start, end, 100); // 增加点数从 50 到 100
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

// 🟢 [核心] 智能路由规划
export const planRoute = async (startAddr: string, endAddr: string, isTrunkLine = false) => {
    const startCoords = await getCoordsByAddress(startAddr);
    const realEndCoords = await getCoordsByAddress(endAddr);
    const districtHubName = extractDistrictHub(endAddr);

    // 🟢 同城判断
    const startCity = extractCity(startAddr);
    const endCity = extractCity(endAddr);
    // 增加容错：只要包含即可 (例如 "南京市" 和 "南京")
    const isSameCity = startCity && endCity && (startCity.includes(endCity) || endCity.includes(startCity));

    console.log(`[Geo] 城市比对: ${startCity} vs ${endCity} => 同城? ${isSameCity}`);

    let targetCoords: [number, number];
    let rawFullPath: number[][] = [];
    let transitStops: { stepIndex: number, hubName: string }[] = [];

    if (isSameCity) {
        // 🟢 同城：直连，无中转
        console.log(`[Geo] 同城模式 -> 直连收货地`);
        targetCoords = realEndCoords;
        rawFullPath = await getDrivingRoute(startCoords, targetCoords);
        // transitStops 保持为空 []
    } else {
        // 🟢 跨城
        console.log(`[Geo] 跨城模式 -> 经过枢纽`);
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

        const hubsToMap = [
            { name: startHubName, coords: startHubCoords },
            { name: endHubName, coords: endHubCoords }
        ];
        const uniqueHubs = startHubName === endHubName ? [hubsToMap[0]] : hubsToMap;
        const tempPath = downsamplePath(rawFullPath, 200);
        transitStops = mapHubsToPath(tempPath, uniqueHubs);
    }

    const finalPath = downsamplePath(rawFullPath, 200);
    
    console.log(`[Geo] 路径规划完成: 起点=${startAddr}, 终点=${endAddr}, 路径点数=${finalPath.length}, 同城=${isSameCity}`);

    return {
        startCoords,
        endCoords: realEndCoords,
        path: finalPath,
        transitStops,
        districtHub: districtHubName,
        isSameCity
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

