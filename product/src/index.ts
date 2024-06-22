import mongoose from 'mongoose';
import app from './app';
import { connectRedis } from './redisClient';

const startRedisServer = () => {
  connectRedis(process.env.PRODUCT_REDIS_URL!)
    .then(() => {
      console.log('Redis client connected');
    })
    .catch((err: any) => {
      console.error('Failed to connect to Redis:', err);
      process.exit(1);
    });
};

const start = async () => {
  if (!process.env.MONGO_USER) {
    throw new Error('Mongo DB User not found');
  }
  if (!process.env.DB_URL) {
    throw new Error('Mongo DB URL not found');
  }
  if (!process.env.MONGO_PASSWORD) {
    throw new Error('Mongo DB password not found');
  }

  if (!process.env.JWT_KEY) {
    throw new Error('JWT is not found');
  }

  if (!process.env.PRODUCT_REDIS_URL) {
    throw new Error('Redis URL not found');
  }

  try {
    mongoose
      .connect(process.env.DB_URL!, {
        user: process.env.MONGO_USER,
        pass: process.env.MONGO_PASSWORD,
      })
      .then(() => console.log('Product Service DB is connected'))
      .catch((err) => {
        console.log(err.message);
        process.exit(1);
      });

    startRedisServer();

    app.listen(4000, () => {
      console.log('Product server running on PORT--> 4000');
    });
  } catch (error: any) {
    console.log(error.message);
  }
};

start();
