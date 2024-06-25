import mongoose from 'mongoose';
import app from './app';
import { connectRedis } from './redisClient';
import { rabbitMQWrapper } from './rabbitMQWrapper';

const startRedisServer = async () => {
  try {
    await connectRedis(process.env.PRODUCT_REDIS_URL!);
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    process.exit(1);
  }
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

  if (!process.env.RABBITMQ_ENDPOINT) {
    throw new Error('RabbitMQ endpoint not found');
  }

  try {
    mongoose.set('strictQuery', false);
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

    await rabbitMQWrapper.connect(process.env.RABBITMQ_ENDPOINT!);

    startRedisServer();

    app.listen(4000, () => {
      console.log('Product server running on PORT--> 4000');
    });
  } catch (error: any) {
    console.log(error.message);
  }
};

start();
