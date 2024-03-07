import { Channel } from 'amqplib';
import { DataSource } from 'typeorm';
import app from './app';
import { config } from './config';
import { queueConnection } from './queue/connection';

export let authChannel: Channel;

const start = async () => {
  // if (!process.env.JWT_KEY) {
  //   throw new Error('JWT is not found');
  // }

  connectDB();
  startQueues();

  app.listen(3000, () => console.log(`Auth service running on PORT 3000....`));
};

const connectDB = async () => {
  try {
    const AppDataSource = new DataSource({
      type: 'postgres',
      port: 5432,
      url: config.DB_URL,
      entities: ['src/entity/*.ts'],
      synchronize: true,
      ssl: false,
    });

    await AppDataSource.initialize();
    console.log('Auth Postgres Server Started...');
  } catch (error: any) {
    console.log(error);
    process.exit(1);
  }
};

const startQueues = async (): Promise<void> => {
  authChannel = (await queueConnection.createConnection()) as Channel;
};

start();
