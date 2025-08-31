import 'express-async-errors';
import cors from 'cors';
import cookieSession from 'cookie-session';
import express, { NextFunction, Request, Response } from 'express';
import { NotFoundError, errorHandler, currentUser } from '@ecom-micro/common';
import { createOrderRoute } from './routes/createOrder';
import { getOrdersRoute } from './routes/getOrders';

const app = express();

// middleware
app.set('trust proxy', true);
app.use(express.json());
app.use(cors());
app.use(
  cookieSession({
    signed: false,
    secure: process.env.NODE_ENV !== 'test',
  })
);

app.use(currentUser);

// Routes
app.use(createOrderRoute);
app.use(getOrdersRoute);

// Health check endpoint
app.get('/api/order/health', (req: Request, res: Response) => {
  res.status(200).json({
    service: 'order-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

app.use('*', (req: Request, res: Response, next: NextFunction) => {
  return next(new NotFoundError(`${req.originalUrl} is not find to this server!`));
});

// global error handlebar
app.use(errorHandler);

export default app;
