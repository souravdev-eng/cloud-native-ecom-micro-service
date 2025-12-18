import { Channel } from 'amqplib';
import mongoose from 'mongoose';

import { queueConnection } from './queue/connection';
import { setAuthChannel } from './queue/channel';
import { logger } from './utils/logger';
import { config } from './config';
import app from './app';

const start = async () => {
  if (!config.AUTH_SERVICE_MONGODB_URL) {
    throw new Error('DB url not found');
  }

  if (!config.MONGO_USER) {
    throw new Error('DB user not found');
  }

  if (!config.MONGO_PASSWORD) {
    throw new Error('DB password not found');
  }

  connectDB();
  startQueues();

  app.listen(3000, () => {
    logger.info('Auth service running on PORT 3000');
  });
};

const connectDB = async () => {
  mongoose
    .connect(config.AUTH_SERVICE_MONGODB_URL!, {
      user: config.MONGO_USER!,
      pass: config.MONGO_PASSWORD!,
    })
    .then(() => {
      logger.info('Auth Service MongoDB connected successfully 🚀🚀');
    })
    .catch((error) => {
      logger.error('💥 DB Error: ', { error: error.message });
    });
};

const startQueues = async (): Promise<void> => {
  const channel = (await queueConnection.createConnection()) as Channel;
  setAuthChannel(channel);
};

start();
