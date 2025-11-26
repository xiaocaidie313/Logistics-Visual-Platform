import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
        },
        phoneNumber: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: true,
            select: false, // 查询时默认不返回密码
        },
        salt: {
            type: String,
            required: false,
            select: false, // 查询时默认不返回盐值
        },
        gender: {
            type: String,
            enum: ['male', 'female', 'other'],
            default: 'other',
        },
        addresses: [
            {
                contactName: {
                    type: String,
                    required: true,
                },
                contactPhone: {
                    type: String,
                    required: true,
                },
                province: {
                    type: String,
                    required: true,
                },
                city: {
                    type: String,
                    required: true,
                },
                district: {
                    type: String,
                    required: true,
                },
                street: {
                    type: String,
                    required: false,
                },
                detailAddress: {
                    type: String,
                    required: true,
                },
                addressTag: {
                    type: String,
                    enum: ['home', 'company', 'other'],
                    default: 'home',
                },
                isDefault: {
                    type: Boolean,
                    default: false,
                },
            },
        ],
    },
    {
        timestamps: true, // 自动添加 createdAt 和 updatedAt
    }
);

// 索引优化
userSchema.index({ phoneNumber: 1 });
userSchema.index({ username: 1 });

const Userinfo = mongoose.model("Userinfo", userSchema);
export default Userinfo;