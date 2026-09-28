import "express-async-errors";
import express, { NextFunction, Request, Response } from "express";
import cookieSession from "cookie-session";
import mongoSanitize from "express-mongo-sanitize";
import {
  NotFoundError,
  errorHandler,
  currentUser,
  mountObservability,
  createHealthRoutes,
} from "@ecom-micro/common";
import mongoose from "mongoose";
import cors from "cors";

import { currentUserRoute } from "./controllers/currentUser";
import { showAllUserRoute } from "./controllers/showAllUser";
import { signOutRoute } from "./controllers/signOut";
import { loginUser } from "./controllers/loginUser";
import { newUser } from "./controllers/newUser";
import { forgotPasswordRoute } from "./controllers/forgotPassword";
import { resetPasswordRoute } from "./controllers/resetPassword";
import { updatePasswordRoute } from "./controllers/updatePassword";
import { authChannel } from "./queue/channel";

const app = express();

// middleware
app.set("trust proxy", 1); //? because we transfer our request via ingress proxy
/** First, so every response, errors included, carries its trace ID for lookup in Tempo. */
mountObservability(app, { service: "auth-service" });

/*
 * Health check routes
 * - mongodb: Checks if MongoDB is connected and responsive.
 * - rabbitmq: Checks if RabbitMQ is connected and responsive.
 */
app.use(
  createHealthRoutes(
    {
      mongodb: async () => {
        const { db, readyState } = mongoose.connection;
        if (readyState !== 1 || !db) {
          throw new Error("MongoDB is not connected");
        }
        await db.command({ ping: 1 }, { timeoutMS: 1000 });
      },
      rabbitmq: async () => {
        if (!authChannel) {
          throw new Error("RabbitMQ is not connected");
        }
        // Built-in exchange: a broker round trip without creating queues or publishing messages.
        await authChannel.checkExchange("amq.direct");
      },
    },
    { timeoutMs: 1000 },
  ),
);

app.use(express.json());

//🔐 Security checks
app.use(
  mongoSanitize({
    allowDots: true,
    replaceWith: "_",
  }),
);

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
app.use(
  cookieSession({
    // name: 'session',
    signed: false,
    secure: false,
    // secure: process.env.NODE_ENV !== 'test',
  }),
);
app.use(currentUser);

// routes
app.use(newUser);
app.use(loginUser);
app.use(signOutRoute);
app.use(currentUserRoute);
app.use(showAllUserRoute);
app.use(forgotPasswordRoute);
app.use(resetPasswordRoute);
app.use(updatePasswordRoute);

app.use("*", (req: Request, res: Response, next: NextFunction) => {
  return next(new NotFoundError(`${req.originalUrl} is not find to this server!`));
});

// global error handlebar
app.use(errorHandler);

export default app;
