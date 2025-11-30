import mongoose from 'mongoose';

// 商家Schema
const merchantSchema = new mongoose.Schema(
    {
        // 基本信息
        merchantName: {
            type: String,
            required: true,
            trim: true,
        },
        merchantCode: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        contactPerson: {
            type: String,
            required: true,
        },
        contactPhone: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            trim: true,
        },
        // 商家地址
        address: {
            province: String,
            city: String,
            district: String,
            detailAddress: String,
            longitude: Number,
            latitude: Number,
        },
        // 商家状态
        status: {
            type: String,
            enum: ['active', 'inactive', 'suspended'],
            default: 'active',
        },
        // 关联的用户ID（用于后续商家登录）
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'UserInfo',
            required: false,
        },
        // 配送方式配置
        deliveryMethods: {
            // 快递配送
            express: {
                enabled: {
                    type: Boolean,
                    default: true,
                },
                // 快递配送范围（省市区列表）
                coverageAreas: [{
                    province: String,
                    city: String,
                    district: String,
                    _id: false,
                }],
            },
            // 即时配送
            instant: {
                enabled: {
                    type: Boolean,
                    default: false,
                },
                // 即时配送范围（基于高德地图）
                coverageAreas: [{
                    cityName: String,
                    cityCode: String,
                    center: {
                        lng: Number,
                        lat: Number,
                    },
                    radius: Number,           // 配送半径（米）
                    polygon: [{              // 多边形范围点
                        lng: Number,
                        lat: Number,
                        _id: false,
                    }],
                    _id: false,
                }],
            },
        },
        // 营业时间
        businessHours: {
            start: String,  // 例如: "09:00"
            end: String,    // 例如: "22:00"
        },
        // 备注
        description: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

// 索引
merchantSchema.index({ merchantCode: 1 });
merchantSchema.index({ merchantName: 1 });
merchantSchema.index({ status: 1 });

const Merchant = mongoose.model('Merchant', merchantSchema);
export default Merchant;
