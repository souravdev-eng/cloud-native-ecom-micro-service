import { Router, Request, Response, NextFunction } from "express";
import { NotFoundError, requestValidation, requireAuth } from "@ecom-micro/common";

import { orderIdValidation } from "../validation/orderValidation";
import { getOrderById } from "../service/order.service";

const router = Router();

/**
 * GET /api/v1/order/:id — one order with its items.
 * Ownership is enforced inside the query (userId is part of the WHERE).
 */
router.get(
  "/api/v1/order/:id",
  requireAuth,
  orderIdValidation,
  requestValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    const order = await getOrderById(req.params.id, req.user.id);

    // 404 (not 403) when it belongs to someone else — don't leak that the id exists.
    if (!order) {
      return next(new NotFoundError("Order not found"));
    }

    res.status(200).send(order);
  },
);

export { router as showOrderRoute };
