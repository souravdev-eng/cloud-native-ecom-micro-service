import mongoose from 'mongoose';
import app from './app';

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
  if (!process.env.NATS_CLIENT_ID) {
    throw new Error('NATS_CLIENT_ID must be defined');
  }
  if (!process.env.NATS_URL) {
    throw new Error('NATS_URL must be defined');
  }
  if (!process.env.NATS_CLUSTER_ID) {
    throw new Error('NATS_CLUSTER_ID must be defined');
  }
  if (!process.env.JWT_KEY) {
    throw new Error('JWT is not found');
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

    app.listen(4000, () => {
      console.log('Product server running on PORT--> 4000');
    });
  } catch (error: any) {
    console.log(error.message);
  }
};

start();
