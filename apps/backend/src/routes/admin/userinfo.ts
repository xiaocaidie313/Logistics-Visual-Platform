import express from 'express';
import { auth } from '../../utils/index.js';
import UserInfoController from '../../controllers/admin/userInfoController.js';

const router = express.Router();

// 创建用户信息
router.post('/userInfo', auth, UserInfoController.createUser.bind(UserInfoController));

// 更新用户信息
router.put('/userInfo/update/:id', auth, UserInfoController.updateUser.bind(UserInfoController));

// 删除用户信息
router.delete('/userInfo/delete/:id', auth, UserInfoController.deleteUser.bind(UserInfoController));

// 获取单个用户信息
router.get('/userInfo/get/:id', auth, UserInfoController.getUser.bind(UserInfoController));

// 根据用户名获取用户信息
router.get('/userInfo/username/:username', auth, UserInfoController.getUserByUsername.bind(UserInfoController));

// 获取用户信息列表
router.get('/userInfo/list', auth, UserInfoController.getUserList.bind(UserInfoController));

// 添加/更新用户地址
router.post('/userInfo/:id/address', auth, UserInfoController.addUserAddress.bind(UserInfoController));

// 删除用户地址
router.delete('/userInfo/:id/address/:addressId', auth, UserInfoController.deleteUserAddress.bind(UserInfoController));

// 设置默认地址
router.put('/userInfo/:id/address/:addressId/default', auth, UserInfoController.setDefaultAddress.bind(UserInfoController));

export default router;
