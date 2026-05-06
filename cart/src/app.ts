import "express-async-errors";
import cors from "cors";
import { NotFoundError, errorHandler, currentUser } from "@ecom-micro/common";
import express, { NextFunction, Request, Response } from "express";
import cookieSession from "cookie-session";
import { newCartRoute } from "./routes/newCart";
import { deleteCartRoute } from "./routes/deleteCart";
import { showAllCartRoute } from "./routes/showAllCart";
import { showAllCartProductRoute } from "./routes/showAllCartProduct";

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003"];

// middleware
app.set("trust proxy", true);
app.use(express.json());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(
  cookieSession({
    signed: false,
    secure: process.env.NODE_ENV !== "test",
  }),
);

app.use(currentUser);

// routes
app.use(newCartRoute);
app.use(showAllCartRoute);
app.use(deleteCartRoute);
app.use(showAllCartProductRoute);

app.use("*", (req: Request, res: Response, next: NextFunction) => {
  return next(new NotFoundError(`${req.originalUrl} is not find to this server!`));
});

// global error handler
app.use(errorHandler);

export default app;
