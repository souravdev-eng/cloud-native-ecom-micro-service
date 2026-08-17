import { Router, Request, Response, NextFunction } from "express";
import { BadRequestError } from "@ecom-micro/common";

import { verifyWebhook } from "../service/payment.service";
import { markOrderPaid } from "../service/order.service";

const router = Router();

/**
 * POST /api/v1/order/webhook/stripe — payment outcomes from Stripe.
 * NOT behind requireAuth: the caller is Stripe, and the signature check IS the
 * authentication. req.body is a raw Buffer here (see express.raw in app.ts).
 */
router.post(
  "/api/v1/order/webhook/stripe",
  async (req: Request, res: Response, next: NextFunction) => {
    const signature = req.headers["stripe-signature"] as string;

    if (!signature) {
      return next(new BadRequestError("Missing stripe-signature header"));
    }

    const event = verifyWebhook(req.body as Buffer, signature);

    // Handle only what we act on; ignore the rest so Stripe stops retrying them.
    switch (event.type) {
      case "payment_intent.succeeded":
        await markOrderPaid((event.data.object as { id: string }).id);
        break;
      // TODO: payment_intent.payment_failed / .canceled → move the order back
      //       to "created" (or "cancelled") so the user can retry
      default:
        break;
    }

    // Always 200 quickly — a slow or error response makes Stripe redeliver.
    res.status(200).send({ received: true });
  },
);

export { router as stripeWebhookRoute };
