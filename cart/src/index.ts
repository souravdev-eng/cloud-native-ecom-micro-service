import { DataSource } from 'typeorm';
import app from './app';
import { Cart } from './entity/Cart';
import { Product } from './entity/Product';
import { ProductCreatedListener } from './events/listeners/productCreatedListener';
import { natsWrapper } from './natsWrapper';

const start = async () => {
  if (!process.env.NATS_CLIENT_ID) {
    throw new Error('NATS_CLIENT_ID must be defined');
  }

  if (!process.env.NATS_URL) {
    throw new Error('NATS_URL must be defined');
  }

  if (!process.env.NATS_CLUSTER_ID) {
    throw new Error('NATS_CLUSTER_ID must be defined');
  }

  if (!process.env.DB_URL) {
    throw new Error('DB_URL must be defined');
  }

  try {
    await natsWrapper.connect(
      process.env.NATS_CLUSTER_ID,
      process.env.NATS_CLIENT_ID,
      process.env.NATS_URL
    );

    natsWrapper.client.on('close', () => {
      console.log('NATS connection closed!');
      process.exit();
    });

    process.on('SIGINT', () => natsWrapper.client.close());
    process.on('SIGTERM', () => natsWrapper.client.close());

    new ProductCreatedListener(natsWrapper.client).listen();

    const AppDataSource = new DataSource({
      type: 'postgres',
      port: 5432,
      url: process.env.DB_URL,
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
  } catch (error: any) {
    console.log('CART DB ERROR', error.message);
  }
  app.listen(3000, () => console.log(`Cart service running on PORT 3000....`));
};

start();
