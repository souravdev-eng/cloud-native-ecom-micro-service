import 'express-async-errors';
import express, { NextFunction, Request, Response } from 'express';
import cookieSession from 'cookie-session';
import { NotFoundError, errorHandler, currentUser } from '@ecom-micro/common';
import cors from 'cors';

import { currentUserRoute } from './controllers/currentUser';
import { showAllUserRoute } from './controllers/showAllUser';
import { signOutRoute } from './controllers/signOut';
import { loginUser } from './controllers/loginUser';
import { newUser } from './controllers/newUser';

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
app.use(newUser);
app.use(loginUser);
app.use(signOutRoute);
app.use(currentUserRoute);
app.use(showAllUserRoute);

app.use('*', (req: Request, res: Response, next: NextFunction) => {
  return next(new NotFoundError(`${req.originalUrl} is not find to this server!`));
});

// global error handlebar
app.use(errorHandler);

export default app;
