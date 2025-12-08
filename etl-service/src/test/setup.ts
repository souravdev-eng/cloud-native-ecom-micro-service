import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { DataSource } from 'typeorm';
import { Product } from '../entities/CartProduct';

declare global {
  var __MONGO__: MongoMemoryServer;
  var __POSTGRES__: DataSource;
}

let mongo: MongoMemoryServer;
let postgres: DataSource;

beforeAll(async () => {
  // Set up test environment variables
  process.env.JWT_KEY = 'test-jwt-key';
  process.env.NODE_ENV = 'test';
  process.env.ENABLE_SCHEDULER = 'false';

  // Set up MongoDB in-memory server
  mongo = await MongoMemoryServer.create();
  const mongoUri = mongo.getUri();
  process.env.PRODUCT_SERVICE_MONGODB_URL = mongoUri;

  await mongoose.connect(mongoUri);

  // Set up PostgreSQL in-memory database (using sqlite for testing)
  postgres = new DataSource({
    type: 'sqlite',
    database: ':memory:',
    entities: [Product],
    synchronize: true,
    logging: false,
  });

  await postgres.initialize();
  
  global.__MONGO__ = mongo;
  global.__POSTGRES__ = postgres;
});

beforeEach(async () => {
  // Clear all collections/tables before each test
  const collections = await mongoose.connection.db.collections();
  for (let collection of collections) {
    await collection.deleteMany({});
  }

  // Clear PostgreSQL tables
  await postgres.synchronize(true);
});

afterAll(async () => {
  if (mongo) {
    await mongo.stop();
  }
  
  if (postgres && postgres.isInitialized) {
    await postgres.destroy();
  }
  
  await mongoose.connection.close();
});
