import { DataSource } from 'typeorm';
import app from './app';
import { config } from './config';

const start = async () => {
  if (!process.env.JWT_KEY) {
    throw new Error('JWT is not found');
  }

  try {
    const AppDataSource = new DataSource({
      type: 'postgres',
      port: 5432,
      url: config.DB_URL,
      entities: ["src/entity/*.ts"],
      synchronize: true,
      ssl: false,
    });

    AppDataSource.initialize()
      .then(() => {
        console.log(`Auth Postgres Server Started...`);
      })
      .catch((err: any) => {
        console.error(err.message);
        process.exit();
      });
  } catch (error: any) {
    console.log(error);
  }
  app.listen(3000, () => console.log(`Auth service running on PORT 3000....`));
};

start();
