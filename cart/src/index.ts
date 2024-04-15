import { DataSource } from 'typeorm';
import app from './app';
import { Cart } from './entity/Cart';
import { Product } from './entity/Product';

const start = async () => {
  if (!process.env.DB_URL) {
    throw new Error('DB_URL must be defined');
  }

  try {
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
