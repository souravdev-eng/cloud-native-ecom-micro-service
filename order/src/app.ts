/* ============================================================================
 * EXPRESS APP — middleware chain + route mounting
 * ============================================================================
 * Order of app.use() matters: security/parsing first, then auth context, then
 * routes, then the 404 catch-all, then the global error handler LAST.
 * ========================================================================== */

// Patches Express 4 so a rejected promise inside an async handler reaches
// errorHandler instead of hanging the request. Must be the first import.
import "express-async-errors";
import express, { NextFunction, Request, Response } from "express";
import cookieSession from "cookie-session";
import cors from "cors";
import { NotFoundError, errorHandler, currentUser } from "@ecom-micro/common";

import { createOrderRoute } from "./routes/createOrder";
import { listOrdersRoute } from "./routes/listOrders";
import { showOrderRoute } from "./routes/showOrder";
import { cancelOrderRoute } from "./routes/cancelOrder";
import { createPaymentRoute } from "./routes/createPayment";
import { stripeWebhookRoute } from "./routes/stripeWebhook";

const app = express();

// We sit behind the NGINX ingress, so trust the proxy for req.secure / req.ip.
app.set("trust proxy", 1);

// Stripe signs the RAW request body — mount the webhook BEFORE express.json()
// or the signature check will always fail on a re-serialized body.
app.use("/api/v1/order/webhook", express.raw({ type: "application/json" }));

app.use(express.json());

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "http://localhost:3003",
      "http://localhost:3004",
    ],
    credentials: true,
  }),
);

// JWT lives in an unsigned cookie-session, same as every other service so the
// token issued by auth is readable here.
app.use(
  cookieSession({
    signed: false,
    secure: false,
  }),
);

// Decodes the JWT into req.user (no-op when absent). requireAuth then enforces.
app.use(currentUser);

// routes — each file exports a Router that declares its own full path.
app.use(stripeWebhookRoute);
app.use(createOrderRoute);
app.use(listOrdersRoute);
app.use(showOrderRoute);
app.use(cancelOrderRoute);
app.use(createPaymentRoute);

app.use("*", (req: Request, res: Response, next: NextFunction) => {
  return next(new NotFoundError(`${req.originalUrl} is not found on this server!`));
});

// Global error handler — converts any CustomError into its JSON shape.
app.use(errorHandler);

export { app };
