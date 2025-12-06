import express from 'express';
import AuthController from '../../controllers/login/authController.js';

const router = express.Router();

// 登录
router.post('/login', AuthController.login.bind(AuthController));

// 注册
router.post('/register', AuthController.register.bind(AuthController));

export default router;
