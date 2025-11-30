import mongoose, { Document, Schema } from 'mongoose';

export interface ITrack extends Document {
    id: string;
    orderId: string;
    logisticsCompany: string;
    logisticsNumber: string;
    logisticsStatus: string;
    orderTime: Date;
    sendAddress: string;
    userAddress: string;

    districtHub: string;
    hubArrivalTime?: Date;

    // 🟢 [新增] 标记是否同城配送
    isSameCity: boolean;

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

    districtHub: { type: String, index: true },
    hubArrivalTime: { type: Date },

    // 🟢 [新增]
    isSameCity: { type: Boolean, default: false },

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