import mongoose, { Document, Schema } from 'mongoose';

// 定义中转站结构
interface TransitStop {
    stepIndex: number; // 在路径数组 path 中的下标索引
    hubName: string;   // 中转站名称 (e.g. "华北转运中心")
}

export interface ITrack extends Document {
    // ... 原有字段保持不变 ...
    id: string;
    orderId: string;
    logisticsCompany: string;
    logisticsNumber: string;
    logisticsStatus: string;
    arriveTime?: Date;
    orderTime: Date;
    sendAddress: string;
    userAddress: string;

    tracks: Array<{
        time: Date;
        location: string;
        description: string;
        status: string;
        operator?: string;
    }>;

    province: string;
    startCoords: number[];
    endCoords: number[];
    currentCoords: number[];
    path: number[][];

    // 🟢 [新增] 存储规划好的中转站点信息
    transitStops: TransitStop[];
}

const trackSchema = new Schema({
    // ... 原有字段保持不变 ...
    id: { type: String, required: true, unique: true },
    orderId: { type: String, required: true },
    logisticsCompany: { type: String, required: true },
    logisticsNumber: { type: String, required: true, unique: true },
    logisticsStatus: { type: String, default: "pending" },
    orderTime: { type: Date, required: true },
    sendAddress: { type: String, required: true },
    userAddress: { type: String, required: true },

    tracks: [{
        time: { type: Date, required: true },
        location: { type: String, required: true },
        description: { type: String, required: true },
        status: { type: String },
        operator: { type: String }
    }],

    province: { type: String },
    startCoords: { type: [Number] },
    endCoords: { type: [Number] },
    currentCoords: { type: [Number] },
    path: { type: [[Number]], default: [] },

    // 🟢 [新增]
    transitStops: [{
        stepIndex: Number,
        hubName: String
    }]
});

const TrackInfo = mongoose.model<ITrack>('Track', trackSchema);
export default TrackInfo;