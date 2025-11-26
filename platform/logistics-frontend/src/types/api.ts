export interface TrackLog {
    time: string;
    location: string;
    description: string;
    status: string;
    operator?: string;
}

export interface OrderData {
    id: string;
    orderId: string;
    logisticsCompany: string; // 必须有
    logisticsNumber: string;  // 必须有
    logisticsStatus: string;
    sendAddress: string;
    userAddress: string;
    province?: string;
    path: number[][];
    currentCoords: number[];
    startCoords?: number[];
    endCoords?: number[];
    transitStops?: any[];
    tracks: TrackLog[];
}

export interface ProvinceStat {
    name: string;
    value: number;
}