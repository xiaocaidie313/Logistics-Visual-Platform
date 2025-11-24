// 定义全国核心中转枢纽 (Hubs)
const HUBS: Record<string, [number, number]> = {
    '华北中心(北京)': [116.40, 39.90],
    '华东中心(上海)': [121.47, 31.23],
    '华南中心(广州)': [113.26, 23.12],
    '华中中心(武汉)': [114.30, 30.59],
    '西南中心(成都)': [104.06, 30.67],
    '西北中心(西安)': [108.93, 34.27]
};

// 模拟常用省市坐标库 (用于地址转坐标)
const CITY_DB: Record<string, [number, number]> = {
    '北京市': [116.40, 39.90], '上海市': [121.47, 31.23],
    '广东省': [113.26, 23.12], '深圳市': [114.05, 22.54],
    '浙江省': [120.15, 30.28], '杭州市': [120.19, 30.26],
    '江苏省': [118.79, 32.06], '南京市': [118.76, 32.04],
    '四川省': [104.06, 30.67], '湖北省': [114.30, 30.59],
    '山东省': [117.02, 36.65], '河南省': [113.62, 34.74],
    '陕西省': [108.93, 34.27], '福建省': [119.29, 26.07]
};

// 1. 地址转坐标 (模拟 Geocoding)
export const getCoordsByAddress = (address: string): [number, number] => {
    for (const key in CITY_DB) {
        if (address.includes(key)) {
            // 加一点随机偏移，防止所有点重叠
            const base = CITY_DB[key];
            return [base[0] + (Math.random() * 0.1 - 0.05), base[1] + (Math.random() * 0.1 - 0.05)];
        }
    }
    return [116.40, 39.90]; // 默认返回北京
};

// 2. 提取省份 (用于统计密度)
export const extractProvince = (address: string): string => {
    const provinces = ['北京市', '上海市', '广东省', '浙江省', '江苏省', '四川省', '湖北省', '山东省', '河南省', '河北省', '陕西省', '福建省', '湖南省', '安徽省', '辽宁省', '黑龙江省', '吉林省', '广西', '云南省', '贵州省', '山西省', '江西省', '天津市', '重庆市'];
    for (const p of provinces) {
        if (address.includes(p)) return p;
    }
    return '其他';
};

// 3. 计算距离 (简单的欧氏距离，用于找最近的中转站)
const getDist = (p1: number[], p2: number[]) => {
    return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
};

// 4. 生成直线插值点 (让轨迹平滑)
const generateLine = (start: number[], end: number[], steps: number) => {
    const path = [];
    for (let i = 0; i <= steps; i++) {
        const lng = start[0] + (end[0] - start[0]) * (i / steps);
        const lat = start[1] + (end[1] - start[1]) * (i / steps);
        path.push([lng, lat]);
    }
    return path;
};

// 5. [核心] 智能路由规划
export const planRoute = (startAddr: string, endAddr: string) => {
    const startCoords = getCoordsByAddress(startAddr);
    const endCoords = getCoordsByAddress(endAddr);

    // 寻找离起点最近的中转站
    let startHub = Object.values(HUBS)[0];
    let minStartDist = Infinity;
    for (const hub of Object.values(HUBS)) {
        const d = getDist(startCoords, hub);
        if (d < minStartDist) { minStartDist = d; startHub = hub; }
    }

    // 寻找离终点最近的中转站
    let endHub = Object.values(HUBS)[0];
    let minEndDist = Infinity;
    for (const hub of Object.values(HUBS)) {
        const d = getDist(endCoords, hub);
        if (d < minEndDist) { minEndDist = d; endHub = hub; }
    }

    // 构建路径关键点：起点 -> 起点中转站 -> 终点中转站 -> 终点
    const keyPoints = [startCoords];

    // 如果起点和中转站距离够远，才经过中转站
    if (minStartDist > 0.5) keyPoints.push(startHub);

    // 如果两个中转站不是同一个，且距离较远，中间连接起来
    if (startHub !== endHub && getDist(startHub, endHub) > 0.5) {
        keyPoints.push(endHub);
    } else if (startHub !== endHub) {
        // 两个中转站很近，只取终点中转站
        keyPoints.push(endHub);
    }

    if (minEndDist > 0.5) keyPoints.push(endHub); // 确保最后经过终点中转站
    keyPoints.push(endCoords);

    // 生成完整插值路径 (每个线段生成 50 个点)
    const fullPath: number[][] = [];
    for (let i = 0; i < keyPoints.length - 1; i++) {
        // 去重，防止重叠
        if (i > 0) fullPath.pop();
        fullPath.push(...generateLine(keyPoints[i], keyPoints[i + 1], 40));
    }

    return { startCoords, endCoords, path: fullPath };
};