import mongoose from 'mongoose'

const goodsSchema = new mongoose.Schema(
    {
        id:{
            type:String,
            required:true,
            unique:true,
        },
        skuname:{
            type:String,
            required:true,
        },
        orderId:{
            type:String,
            required:true,
        },
        price:{
            type:Number,
            required:true,
        },
        amount:{
            type:Number,
            required:true,
        },
        totprice:{
            type:Number,
            required:true,
        },
        images:{    
            type:String,
            required:true,
        },
        arrivetime:{
            type:String,
            required:true,
        },
        sendtime:{
            type:String,
            required:true,
        },
        ordertime:{
            type:String,
            required:true,
        },
        useraddress:{
            type:String,
            required:true,
        },
        sendaddress:{
            type:String,
            required:true,
        },
        status:{
            type:String,
            enum:{
                values:["pending", "paid", "shipped","confirmed", "delivered", "cancelled", "refunded"],
                default:"pending",
            },
            required:true,
        },
    },  
);

const Goods = mongoose.model("Goods", goodsSchema);
export default Goods;