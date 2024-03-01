import 'express-async-errors';
import cors from 'cors';
import { Product } from './entity/Product';
import { NotFoundError, errorHandler, currentUser } from '@ecom-micro/common';
import express, { NextFunction, Request, Response } from 'express';
import cookieSession from 'cookie-session';
import { newCartRoute } from './routes/newCart';

const app = express();

// middleware
app.set('trust proxy', true); //? because we transfer our request via ingress proxy
app.use(express.json());
app.use(cors());
app.use(
  cookieSession({
    signed: false,
    secure: process.env.NODE_ENV !== 'test',
  })
);

app.use(currentUser);

// routes
app.use(newCartRoute);

app.get('/api/cart/all', async (req, res) => {
  const product = await Product.find();
  res.send(product);
});

app.use('*', (req: Request, res: Response, next: NextFunction) => {
  return next(new NotFoundError(`${req.originalUrl} is not find to this server!`));
});

// global error handlebar
app.use(errorHandler);

export default app;
