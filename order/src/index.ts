import mongoose from 'mongoose';
import app from './app';
import { rabbitMQWrapper } from './rabbitMQWrapper';
import { CartCreatedListener } from './queue/listeners/cartCreatedListener';
import { CartUpdatedListener } from './queue/listeners/cartUpdatedListener';
import { CartDeletedListener } from './queue/listeners/cartDeletedListener';

const start = async () => {
  if (!process.env.ORDER_SERVICE_MONGODB_URL) {
    throw new Error('ORDER_SERVICE_MONGODB_URL must be defined');
  }

  if (!process.env.MONGO_USER) {
    throw new Error('MONGO_USER must be defined');
  }

  if (!process.env.MONGO_PASSWORD) {
    throw new Error('MONGO_PASSWORD must be defined');
  }

  if (!process.env.RABBITMQ_ENDPOINT) {
    throw new Error('RABBITMQ_ENDPOINT must be defined');
  }

  try {
    mongoose.set('strictQuery', true);
    mongoose
      .connect(process.env.ORDER_SERVICE_MONGODB_URL!, {
        user: process.env.MONGO_USER,
        pass: process.env.MONGO_PASSWORD,
      })
      .then(() => console.log('Order Service DB is connected ~~ 🚀🚀'))
      .catch((err) => {
        console.log(err.message);
        process.exit(1);
      });

    await rabbitMQWrapper.connect(process.env.RABBITMQ_ENDPOINT!);

    // Set up cart event listeners
    await new CartCreatedListener(rabbitMQWrapper.channel).listen();
    await new CartUpdatedListener(rabbitMQWrapper.channel).listen();
    await new CartDeletedListener(rabbitMQWrapper.channel).listen();

    app.listen(4000, () => {
      console.log('Order server running on PORT ~~ 4000');
    });
  } catch (error: any) {
    console.log(error.message);
  }
};

start();
