import { Router, Request, Response, NextFunction } from "express";
import { requestValidation, requireAuth, restrictTo } from "@ecom-micro/common";

import { createOrderValidation } from "../validation/orderValidation";
import { createOrder } from "../service/order.service";
import { OrderCreatedPublisher } from "../queue/publisher/orderCreatedPublisher";
import { rabbitMQWrapper } from "../rabbitMQWrapper";

const router = Router();

/**
 * POST /api/v1/order/new — place a new order.
 * body: { items: [{ productId, quantity }] }
 * Middleware order is fixed: requireAuth → restrictTo → chain → requestValidation.
 */
router.post(
  "/api/v1/order/new",
  requireAuth,
  restrictTo("user"),
  createOrderValidation,
  requestValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    // req.user is populated by currentUser + guaranteed present by requireAuth.
    const order = await createOrder(req.user.id, { items: req.body.items });

    // Publish AFTER the write succeeds so consumers never see a phantom order.
    await new OrderCreatedPublisher(rabbitMQWrapper.channel).publish({
      orderId: order.id,
      userId: order.userId,
      status: order.status,
      totalAmount: order.totalAmount,
      currency: order.currency,
      items: order.items.map((i) => ({
        productId: i.productId,
        title: i.title,
        price: i.price,
        quantity: i.quantity,
      })),
      createdAt: order.createdAt.toISOString(),
    });

    res.status(201).send(order);
  },
);

export { router as createOrderRoute };
