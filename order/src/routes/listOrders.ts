import { Router, Request, Response, NextFunction } from "express";
import { requireAuth } from "@ecom-micro/common";

import { listOrdersByUser } from "../service/order.service";

const router = Router();

/**
 * GET /api/v1/order — the caller's own orders, newest first.
 * query: ?limit=20&offset=0
 */
router.get(
  "/api/v1/order",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    // Clamp the page size so a client can't ask for the whole table.
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const orders = await listOrdersByUser(req.user.id, { limit, offset });

    res.status(200).send({ count: orders.length, limit, offset, orders });
  },
);

export { router as listOrdersRoute };
