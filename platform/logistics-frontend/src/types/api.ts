// 定义后端返回的单个物流节点日志
export interface TrackLog {
    time: string;
    location: string;
    description: string;
    status: string;
}

// 定义后端返回的完整订单结构
export interface OrderData {
    id: string;
    orderId: string;
    logisticsStatus: string; // 'pending' | 'shipped' | 'delivered'
    sendAddress: string;
    userAddress: string;
    path: number[][]; // 完整路径 [lng, lat][]
    currentCoords: number[];
    tracks: TrackLog[]; // 物流时间轴日志
}

// ECharts 图表数据结构
export interface ProvinceStat {
    name: string;
    value: number;
}