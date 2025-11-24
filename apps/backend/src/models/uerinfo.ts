import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
    {
        id:{
            type:String,
            required:true,
            unique:true,
        },
        username:{
            type:String,
            required:true,
            unique:true,
        },
        useraddress:{
            type:String,
            required:true,
        },
        phoneNumber: {
            type: String,
            required: true,
        },
    },
);

const Userinfo = mongoose.model("Userinfo", userSchema);
export default Userinfo;