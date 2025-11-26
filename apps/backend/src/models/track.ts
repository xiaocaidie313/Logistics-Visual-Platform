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
            values:["pending", "paid", "shipped", "confirmed", "delivered", "cancelled", "refunded"],
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
            enum:["pending", "paid", "shipped", "confirmed", "delivered", "cancelled", "refunded"],
        },
        operator:{
            type:String,
            required:false,
        }
    }]
})

const TrackInfo = mongoose.model('Track', trackSchema);

export default TrackInfo;