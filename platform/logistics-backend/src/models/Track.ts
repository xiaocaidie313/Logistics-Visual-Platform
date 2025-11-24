import mongoose, { Document, Schema } from 'mongoose';

export interface ITrack extends Document {
    // --- 原有业务字段 ---
    id: string;
    orderId: string;
    logisticsCompany: string;
    logisticsNumber: string;
    logisticsStatus: string;
    arriveTime?: Date;
    orderTime: Date;
    sendTime?: Date;
    receiveTime?: Date;
    sendAddress: string;
    userAddress: string;
    completeTime?: Date;
    fakeArriveTime?: Date;
    tracks: Array<{
        time: Date;
        location: string;
        description: string;
        status: string;
        operator?: string;
    }>;

    // --- [新增] 地图可视化与统计专用字段 ---
    province: string;       // 目的省份 (从 userAddress 提取，用于密度统计)
    startCoords: number[];  // 发货坐标 [lng, lat]
    endCoords: number[];    // 收货坐标
    currentCoords: number[];// 实时小车坐标
    path: number[][];       // 规划的完整路径 (含中转点)
}

const trackSchema = new Schema({
    id: { type: String, required: true, unique: true },
    orderId: { type: String, required: true },
    logisticsCompany: { type: String, required: true },
    logisticsNumber: { type: String, required: true, unique: true },
    logisticsStatus: {
        type: String,
        enum: ["pending", "paid", "shipped", "confirmed", "delivered", "cancelled", "refunded"],
        default: "pending",
        required: true,
    },
    arriveTime: { type: Date },
    orderTime: { type: Date, required: true },
    sendTime: { type: Date },
    receiveTime: { type: Date },
    sendAddress: { type: String, required: true },
    userAddress: { type: String, required: true },
    completeTime: { type: Date },
    fakeArriveTime: { type: Date },

    tracks: [{
        time: { type: Date, required: true },
        location: { type: String, required: true },
        description: { type: String, required: true },
        status: { type: String, enum: ["pending", "paid", "shipped", "confirmed", "delivered", "cancelled", "refunded"] },
        operator: { type: String }
    }],

    // --- 新增字段定义 ---
    province: { type: String }, // 用于 ECharts 按省份统计
    startCoords: { type: [Number] },
    endCoords: { type: [Number] },
    currentCoords: { type: [Number] }, // 小车当前位置
    path: { type: [[Number]], default: [] } // 完整轨迹点数组
});

const TrackInfo = mongoose.model<ITrack>('Track', trackSchema);
export default TrackInfo;