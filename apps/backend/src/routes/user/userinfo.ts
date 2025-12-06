import express from 'express';
import UserUserInfoController from '../../controllers/user/userInfoController.js';

const router = express.Router();

// 创建用户信息
router.post('/userInfo', UserUserInfoController.createUser.bind(UserUserInfoController));

// 更新用户信息
router.put('/userInfo/update/:id', UserUserInfoController.updateUser.bind(UserUserInfoController));

// 删除用户信息
router.delete('/userInfo/delete/:id', UserUserInfoController.deleteUser.bind(UserUserInfoController));

// 获取单个用户信息
router.get('/userInfo/get/:id', UserUserInfoController.getUser.bind(UserUserInfoController));

// 根据用户名获取用户信息
router.get('/userInfo/username/:username', UserUserInfoController.getUserByUsername.bind(UserUserInfoController));

export default router;
