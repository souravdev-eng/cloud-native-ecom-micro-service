import express from 'express';
import 'express-async-errors';
import cors from 'cors';
import cookieSession from 'cookie-session';
import { errorHandler, NotFoundError, currentUser } from '@ecom-micro/common';

import { syncRoutes } from './routes/syncRoutes';
import { healthRoutes } from './routes/healthRoutes';
import { schedulerRoutes } from './routes/schedulerRoutes';
import { cartSyncRoutes } from './routes/cartSyncRoutes';

const app = express();

app.set('trust proxy', true);
app.use(express.json());
app.use(cors());
app.use(
  cookieSession({
    signed: false,
    secure: false, // Set to true in production with HTTPS
  })
);

app.use(currentUser);

// Routes
app.use(syncRoutes);          // Product sync routes
app.use(cartSyncRoutes);      // Cart → Order sync routes
app.use(healthRoutes);
app.use(schedulerRoutes);

app.all('*', async () => {
  throw new NotFoundError('Route not found');
});

app.use(errorHandler);

export default app;
