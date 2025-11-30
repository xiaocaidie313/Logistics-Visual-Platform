import mongoose, { Document, Schema } from 'mongoose';

export interface ITrack extends Document {
    id: string;
    orderId: string;
    logisticsCompany: string;
    logisticsNumber: string;
    // 状态流转: shipped (运输中) -> waiting_for_delivery (到站等待) -> delivering (派送中) -> delivered (已签收)
    logisticsStatus: string;
    orderTime: Date;
    sendAddress: string;
    userAddress: string;

    // 🟢 [新增] 所属区级站点 (例如: "江苏省南京市栖霞区")
    districtHub: string;
    // 🟢 [新增] 到达站点的时间 (用于判断1小时超时)
    hubArrivalTime?: Date;

    tracks: Array<{
        time: Date;
        location: string;
        description: string;
        status: string;
        operator?: string;
    }>;

    province: string;
    startCoords: [number, number];
    endCoords: [number, number];
    currentCoords: [number, number];
    path: [number, number][];
    transitStops: Array<{ stepIndex: number; hubName: string }>;
}

const trackSchema = new Schema({
    id: { type: String, required: true, unique: true },
    orderId: { type: String, required: true },
    logisticsCompany: { type: String, required: true },
    logisticsNumber: { type: String, required: true, unique: true },
    logisticsStatus: { type: String, default: "pending" },
    orderTime: { type: Date, required: true },
    sendAddress: { type: String, required: true },
    userAddress: { type: String, required: true },

    // 🟢 [新增字段]
    districtHub: { type: String, index: true },
    hubArrivalTime: { type: Date },

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
    transitStops: [{
        stepIndex: Number,
        hubName: String
    }]
});

const TrackInfo = mongoose.model<ITrack>('Track', trackSchema);
export default TrackInfo;