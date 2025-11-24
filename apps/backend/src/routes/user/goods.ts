import express from 'express'
import { sendResponse } from '../../shared/sendresponse.js';
import type { Request, Response} from 'express'
import Goods from '../../models/goods.js'

const router = express.Router();
// 创建订单
router.post('/order', async (req: Request, res: Response) => {
    try {
        const orderData = req.body; // 从请求体获取信息 
        const newOrder = new Goods(orderData); //生成新订单
        const savedOrder = await newOrder.save(); // 保存订单
        sendResponse(res, 200, 'Success', savedOrder);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '创建订单失败'; // 报错
        sendResponse(res, 400, errorMessage, {});
    }
});

// 更改订单
router.put('/order/update/:id', async (req:Request, res:Response) =>{
    try{
        const newOrder = req.body;
        //  mongoose的 findByIdAndUpdate 方法 
        const updatedOrder = await Goods.findByIdAndUpdate(req.params.id, newOrder, { new: true });
        sendResponse(res, 200, 'Success', updatedOrder);
    }
    catch(error:unknown){
        const errorMessage = error instanceof Error ? error.message : '更改订单失败'; // 报错
        sendResponse(res, 400, errorMessage, {});

    }
});
// 删除订单
router.delete('/order/delete/:id', async (req:Request, res: Response) =>{
    try{
        const orderId = req.params.id;
        const deletedOrder = await Goods.findByIdAndDelete(orderId);
        sendResponse(res, 200, 'Success', deletedOrder);
    }catch(error:unknown)
    {
        const errorMessage = error instanceof Error ? error.message : '删除订单失败'; // 报错
        sendResponse(res, 400, errorMessage, {});
    }
});

// 获取订单
router.get('/order/get/:id',async (req:Request, res:Response) =>{
    try{
        const orderId = req.params.id
        const order = await Goods.findById(orderId);
        sendResponse(res, 200, 'Success', order);
    }catch(error:unknown){
        const errorMessage = error instanceof Error ? error.message : '获取订单失败'; // 报错
        sendResponse(res, 400, errorMessage, {});
    }
});
// 获取订单列表
router.get('/order/list', async(req:Request, res:Response) =>{
    try{
        const orders = await Goods.find();
        sendResponse(res, 200, 'Success', orders);
    }catch(error:unknown){
        const erroMessage = error instanceof Error ? error.message : '获取订单列表失败'; // 报错
        sendResponse(res, 400, erroMessage, {})
    }
});



export default router;