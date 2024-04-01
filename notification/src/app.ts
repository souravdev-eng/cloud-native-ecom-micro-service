import 'express-async-errors';
import express, { NextFunction, Request, Response } from 'express';
import { NotFoundError, errorHandler, currentUser } from '@ecom-micro/common';
import cors from 'cors';

const app = express();

// middleware
app.set('trust proxy', 1); //? because we transfer our request via ingress proxy
app.use(express.json());

app.use(cors());

app.use(currentUser);

app.use('*', (req: Request, res: Response, next: NextFunction) => {
  return next(new NotFoundError(`${req.originalUrl} is not find to this server!`));
});

// global error handlebar
app.use(errorHandler);

export default app;
