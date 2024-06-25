import { DataSource } from 'typeorm';
import app from './app';
import { Cart } from './entity/Cart';
import { Product } from './entity/Product';
import { rabbitMQWrapper } from './rabbitMQWrapper';
import { ProductCreatedListener } from './queues/listener/productCreatedListener';

const start = async () => {
  if (!process.env.CART_DB_URL) {
    throw new Error('CART_DB_URL must be defined');
  }

  if (!process.env.RABBITMQ_ENDPOINT) {
    throw new Error('RABBITMQ_ENDPOINT must be defined');
  }

  try {
    const AppDataSource = new DataSource({
      type: 'postgres',
      port: 5432,
      url: process.env.CART_DB_URL,
      entities: [Cart, Product],
      synchronize: true,
    });

    AppDataSource.initialize()
      .then(() => {
        console.log(`Cart Postgres Server Started...`);
      })
      .catch((err: any) => {
        console.error(err.message);
        process.exit();
      });

    await rabbitMQWrapper.connect(process.env.RABBITMQ_ENDPOINT!);
    new ProductCreatedListener(rabbitMQWrapper.channel).listen();
  } catch (error: any) {
    console.log('CART DB ERROR', error.message);
  }
  app.listen(4000, () => console.log(`Cart service running on PORT 4000....`));
};

start();
