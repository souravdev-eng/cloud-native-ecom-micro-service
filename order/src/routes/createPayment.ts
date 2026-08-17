import { Router, Request, Response, NextFunction } from "express";
import {
  BadRequestError,
  NotFoundError,
  requestValidation,
  requireAuth,
} from "@ecom-micro/common";

import { createPaymentValidation } from "../validation/orderValidation";
import { getOrderById } from "../service/order.service";
import { createPaymentIntent } from "../service/payment.service";

const router = Router();

/**
 * POST /api/v1/order/:id/payment — start paying for an order.
 * Returns the Stripe client_secret; the browser confirms the card with it and
 * the real state change arrives back on the webhook, not on this response.
 */
router.post(
  "/api/v1/order/:id/payment",
  requireAuth,
  createPaymentValidation,
  requestValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    const order = await getOrderById(req.params.id, req.user.id);

    if (!order) {
      return next(new NotFoundError("Order not found"));
    }

    // Never re-charge a terminal order.
    if (order.status === "cancelled" || order.status === "paid") {
      return next(new BadRequestError(`Cannot pay for a ${order.status} order`));
    }

    const { clientSecret } = await createPaymentIntent(order);

    res.status(201).send({ clientSecret });
  },
);

export { router as createPaymentRoute };
