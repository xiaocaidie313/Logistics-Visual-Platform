// 增加商户脚本
import mongoose from 'mongoose'
import UserInfo from '../src/models/userinfo.js'
import { hashPassword} from '../src/utils/index.js'

const MONGODB_URI = "mongodb://lms:123lms@47.109.143.184:27017/logistics";

// 增加用户函数
const addMerchant  = async () =>{
    // 链接数据库
    await mongoose.connect(MONGODB_URI)
    console.log('=====数据库连接成功=====')
    try{
        const merchantData = {
            username:'customer03',
            phoneNumber:'13325563890',
            password:'123customer03',
            role:'customer', // 商户角色  role:admin,merchant,customer  // 
            gender:'other',
            salt:'',
            addresses:[{
                contactName:'客户02',
                contactPhone:'13325563890',
                province:'内蒙古',  
                city:'呼和浩特市',
                district:'赛罕区',
                street:'',
                detailAddress:'呼和浩特市赛罕区科技路4号',
                addressTag:'home',
                isDefault:true,
            }],
        }
        // 模拟加密
        const { hashedPassword, salt } = hashPassword(merchantData.password);
        merchantData.password = hashedPassword;
        merchantData.salt = salt;
        const newMerchant = new UserInfo(merchantData);
        const savedMerchant = await newMerchant.save();
        console.log('=====添加成功=====')
        console.log('用户信息:', savedMerchant);
        await mongoose.disconnect();
        console.log('=====数据库连接已关闭=====');
    } catch (error: unknown) {
        console.error('错误:', error);
        console.log('=====添加失败=====');
    }
};
// 执行添加账号
addMerchant();