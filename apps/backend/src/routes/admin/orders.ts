import express from "express";
import type { Request, Response } from "express"; // 引入类型 避免报错
import Orders from "../../models/order.js";
import { sendResponse } from "../../utils/index.js"; // 引入共用函数
import {
  emitOrderCreated,
  emitOrderUpdate,
  emitOrderStatusChange,
} from "../../services/websocket.js";

const router = express.Router();

// 创建订单
router.post("/order", async (req: Request, res: Response) => {
  try {
    const orderData = req.body; // 从请求体获取信息
    const newOrder = new Orders(orderData); //生成新订单
    const savedOrder = await newOrder.save(); // 保存订单

    // 推送 WebSocket 事件
    emitOrderCreated(savedOrder.orderId, savedOrder);

    sendResponse(res, 200, "Success", savedOrder);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "创建订单失败"; // 报错
    sendResponse(res, 400, errorMessage, {});
  }
});

// 更改订单
//  其实不只是id  还有orderID  考虑 skuname?
router.put("/order/update/:id", async (req: Request, res: Response) => {
  try {
    const newOrder = req.body;
    //  mongoose的 findByIdAndUpdate 方法
    const updatedOrder = await Orders.findByIdAndUpdate(
      req.params.id,
      newOrder,
      { new: true }
    );

    if (updatedOrder) {
      // 推送 WebSocket 事件
      emitOrderUpdate(updatedOrder.orderId, updatedOrder);
    }

    sendResponse(res, 200, "Success", updatedOrder);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "更改订单失败";
    sendResponse(res, 400, errorMessage, {});
  }
});
// 删除订单
//  其实不只是id  还有orderID  考虑 skuname?

router.delete("/order/delete/:id", async (req: Request, res: Response) => {
  try {
    const orderId = req.params.id;
    const deletedOrder = await Orders.findByIdAndDelete(orderId);
    sendResponse(res, 200, "Success", deletedOrder);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "删除订单失败";
    sendResponse(res, 400, errorMessage, {});
  }
});

// 获取订单
router.get("/order/get/:id", async (req: Request, res: Response) => {
  try {
    const orderId = req.params.id;
    const order = await Orders.findById(orderId);
    sendResponse(res, 200, "Success", order);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "获取订单失败"; // 报错
    sendResponse(res, 400, errorMessage, {});
  }
});
// 获取订单列表
router.get("/order/list", async (req: Request, res: Response) => {
  try {
    const orders = await Orders.find();
    sendResponse(res, 200, "Success", orders);
  } catch (error: unknown) {
    const erroMessage =
      error instanceof Error ? error.message : "获取订单列表失败"; // 报错
    sendResponse(res, 400, erroMessage, {});
  }
});
//切换状态
router.put("/order/switch/status/:id", async (req: Request, res: Response) => {
  try {
    const orderId = req.params.id;
    const newStatus = req.body.status;
    const updatedOrder = await Orders.findByIdAndUpdate(
      orderId,
      { status: newStatus },
      { new: true }
    );

    if (updatedOrder) {
      // 推送 WebSocket 事件
      emitOrderStatusChange(updatedOrder.orderId, newStatus, updatedOrder);
    }

    sendResponse(res, 200, "Success", updatedOrder);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "切换订单状态失败";
    sendResponse(res, 400, errorMessage, {});
  }
});
// 筛选订单
/// 1 订单状态筛选
/// 1.1 pending状态
router.get("/order/filter/pending", async (req: Request, res: Response) => {
  try {
    const pendingOrders = await Orders.find({ status: "pending" });
    sendResponse(res, 200, "Success", pendingOrders);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "获取待处理订单失败";
    sendResponse(res, 400, errorMessage, {});
  }
});
/// 1.2 paid状态
router.get("/order/filter/paid", async (req: Request, res: Response) => {
  try {
    const paidOrders = await Orders.find({ status: "paid" });
    sendResponse(res, 200, "Success", paidOrders);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "获取已支付订单失败";
    sendResponse(res, 400, errorMessage, {});
  }
});
/// 1.3 shipped状态
router.get("/order/filter/shipped", async (req: Request, res: Response) => {
  try {
    const shippedOrders = await Orders.find({ status: "shipped" });
    sendResponse(res, 200, "Success", shippedOrders);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "获取已发货订单失败";
    sendResponse(res, 400, errorMessage, {});
  }
});
/// 1.4 confirmed状态
router.get("/order/filter/confirmed", async (req: Request, res: Response) => {
  try {
    const confirmedOrders = await Orders.find({ status: "confirmed" });
    sendResponse(res, 200, "Success", confirmedOrders);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "获取已确认订单失败";
    sendResponse(res, 400, errorMessage, {});
  }
});
/// 1.5 delivered状态
router.get("/order/filter/delivered", async (req: Request, res: Response) => {
  try {
    const deliveredOrders = await Orders.find({ status: "delivered" });
    sendResponse(res, 200, "Success", deliveredOrders);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "获取已送达订单失败";
    sendResponse(res, 400, errorMessage, {});
  }
});
/// 1.6 cancelled状态
router.get("/order/filter/cancelled", async (req: Request, res: Response) => {
  try {
    const cancelledOrders = await Orders.find({ status: "cancelled" });
    sendResponse(res, 200, "Success", cancelledOrders);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "获取已取消订单失败";
    sendResponse(res, 400, errorMessage, {});
  }
});

/// 1.7 refunded状态
router.get("/order/filter/refunded", async (req: Request, res: Response) => {
  try {
    const refundedOrders = await Orders.find({ status: "refunded" });
    sendResponse(res, 200, "Success", refundedOrders);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "获取已退款订单失败";
    sendResponse(res, 400, errorMessage, {});
  }
});
// 2 订单排序
/// 2.1 按订单时间排序
router.get("/order/sort/ordertime/asc", async (req: Request, res: Response) => {
  //升序
  try {
    const sortedOrders = await Orders.find().sort({ ordertime: 1 });
    sendResponse(res, 200, "Success", sortedOrders);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "获取按订单时间排序的订单失败";
    sendResponse(res, 400, errorMessage, {});
  }
});
router.get("/order/sort/ordertime/des", async (req: Request, res: Response) => {
  //降序
  try {
    const sortedOrders = await Orders.find().sort({ ordertime: -1 });
    sendResponse(res, 200, "Success", sortedOrders);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "获取按订单时间排序的订单失败";
    sendResponse(res, 400, errorMessage, {});
  }
});
/// 2.2按照订单总的金额排序
router.get("/order/sort/totprice/asc", async (req: Request, res: Response) => {
  //升序
  try {
    const sortedOrders = await Orders.find().sort({ totprice: 1 });
    sendResponse(res, 200, "Success", sortedOrders);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "获取按订单金额排序的订单失败";
    sendResponse(res, 400, "Error", errorMessage);
  }
});
router.get("/order/sort/totprice/des", async (req: Request, res: Response) => {
  try {
    const sortedOrders = await Orders.find().sort({ totprice: -1 });
    sendResponse(res, 200, "Success", sortedOrders);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "获取按订单金额排序的订单失败";
    sendResponse(res, 400, "Error", errorMessage);
  }
});

export default router;
