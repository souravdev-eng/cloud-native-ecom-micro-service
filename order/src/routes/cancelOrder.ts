import { Router, Request, Response, NextFunction } from "express";
import { requestValidation, requireAuth } from "@ecom-micro/common";

import { orderIdValidation } from "../validation/orderValidation";
import { cancelOrder } from "../service/order.service";
import { OrderCancelledPublisher } from "../queue/publisher/orderCancelledPublisher";
import { rabbitMQWrapper } from "../rabbitMQWrapper";

const router = Router();

/**
 * PATCH /api/v1/order/:id/cancel — cancel an order the caller owns.
 * The status guard (only created/awaiting_payment can be cancelled) lives in
 * the service, so the route just reports the result.
 */
router.patch(
  "/api/v1/order/:id/cancel",
  requireAuth,
  orderIdValidation,
  requestValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    const order = await cancelOrder(req.params.id, req.user.id);

    // Tells product/cart to release the stock this order was holding.
    await new OrderCancelledPublisher(rabbitMQWrapper.channel).publish({
      orderId: order.id,
      userId: order.userId,
      items: order.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      })),
    });

    res.status(200).send(order);
  },
);

export { router as cancelOrderRoute };
