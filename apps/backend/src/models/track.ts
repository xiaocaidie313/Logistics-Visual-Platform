import mongoose from 'mongoose';


const trackSchema = new mongoose.Schema({
    id:{
        type:String,
        required:true,
        unique:true,
    },
    orderId:{
        type:String,
        required:true,
    },
    logisticsCompany:{
        type:String,
        required:true,
    },
    logisticsNumber:{
        type:String,
        required:true,
        unique:true,
    },
    logisticsStatus:{
        type:String,
        enum:{
            values:["pending", "paid", "shipped", "waiting_for_delivery", "delivering", "confirmed", "delivered", "cancelled", "refunded"],
            default:"pending",
        },
        required:true,
    },
    arriveTime:{
        type:Date,
        required:false,
    },
    orderTime:{
        type:Date,
        required:true,
    },
    sendTime:{
        type:Date,
        required:false,
    },
    receiveTime:{
        type:Date,
        required:false,
    },
    sendAddress:{
        type:String,
        required:true,
    },
    userAddress:{
        type:String,
        required:true,
    },
    completeTime:{
        type:Date,
        required:false,
    },
    // 估计的到达时间
    fakeArriveTime:{
        type:Date,
        required:false,
    },
    // 物流轨迹数组
    tracks:[{
        time:{
            type:Date,
            required:true,
        },
        location:{
            type:String,
            required:true,
        },
        description:{
            type:String,
            required:true,
        },
        status:{
            type:String,
            enum:["pending", "paid", "shipped", "waiting_for_delivery", "delivering", "confirmed", "delivered", "cancelled", "refunded"],
        },
        operator:{
            type:String,
            required:false,
        }
    }],
    // 地图可视化相关字段  仿照platform里面的
    // 起点坐标 [经度, 纬度]
    startCoords: {
        type: [Number],
        required: false,
    },
    // 终点坐标 [经度, 纬度]
    endCoords: {
        type: [Number],
        required: false,
    },
    // 当前车辆位置 [经度, 纬度]
    currentCoords: {
        type: [Number],
        required: false,
    },
    // 配送路径坐标数组 [[lng, lat], [lng, lat], ...]
    path: {
        type: [[Number]],
        default: [],
    },
    // 省份（用于统计）
    province: {
        type: String,
        required: false,
    },
    // 区域集散点
    districtHub: {
        type: String,
        required: false,
    },
    // 集散点到达时间
    hubArrivalTime: {
        type: Date,
        required: false,
    },
    // 中转站信息
    transitStops: [{
        stepIndex: {
            type: Number,
            required: false,
        },
        hubName: {
            type: String,
            required: false,
        }
    }],
    // 是否同城配送
    isSameCity: {
        type: Boolean,
        default: false,
    },
    // 取件码
    pickupCode: {
        type: String,
        required: false,
        index: true, // 用于快速查询
    },
    // 取件码生成时间
    pickupCodeGeneratedAt: {
        type: Date,
        required: false,
    },
    // 取件码过期时间
    pickupCodeExpiresAt: {
        type: Date,
        required: false,
    },
    // 自提点位置
    pickupLocation: {
        type: String,
        required: false,
    },
})

const TrackInfo = mongoose.model('Track', trackSchema);

export default TrackInfo;