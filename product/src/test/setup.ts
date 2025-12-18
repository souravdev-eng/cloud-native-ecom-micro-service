import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Mock the RabbitMQ wrapper to prevent actual connections during tests
jest.mock('../rabbitMQWrapper', () => ({
  rabbitMQWrapper: {
    channel: {
      assertExchange: jest.fn().mockResolvedValue(undefined),
      publish: jest.fn().mockReturnValue(true),
      assertQueue: jest.fn().mockResolvedValue({ queue: 'test-queue' }),
      bindQueue: jest.fn().mockResolvedValue(undefined),
      consume: jest.fn().mockResolvedValue(undefined),
      ack: jest.fn(),
      nack: jest.fn(),
      sendToQueue: jest.fn().mockReturnValue(true),
    },
    connect: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock Redis client to prevent actual connections during tests
jest.mock('../redisClient', () => ({
  getRedisClient: jest.fn().mockReturnValue({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    expire: jest.fn().mockResolvedValue(1),
    del: jest.fn().mockResolvedValue(1),
  }),
  connectRedis: jest.fn().mockResolvedValue(undefined),
}));

declare global {
  function signIn(): string[];
  function sellerSignIn(): any;
}

let mongo: MongoMemoryServer;

beforeAll(async () => {
  process.env.JWT_KEY = 'asdfasdf';
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  process.env.JWT_EXP = '90d';

  mongo = await MongoMemoryServer.create();
  const mongoUri = await mongo.getUri();

  await mongoose.connect(mongoUri);
}, 120000); // 2 minutes timeout for MongoDB binary download on first run

beforeEach(async () => {
  jest.clearAllMocks();
  const db = mongoose.connection.db;
  if (db) {
    const collections = await db.collections();
    for (let collection of collections) {
      await collection.deleteMany({});
    }
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) {
    await mongo.stop();
  }
});

global.signIn = () => {
  // Build a JWT payload.  { id, email }
  // Use valid MongoDB ObjectId format (24-character hex string)
  const payload = {
    id: new mongoose.Types.ObjectId().toHexString(),
    email: 'test@test.com',
  };

  // Create the JWT!
  const token = jwt.sign(payload, process.env.JWT_KEY!);

  // Build session Object. { jwt: MY_JWT }
  const session = { jwt: token };

  // Turn that session into JSON
  const sessionJSON = JSON.stringify(session);
  // Take JSON and encode it as base64
  const base64 = Buffer.from(sessionJSON).toString('base64');

  // return a string thats the cookie with the encoded data
  return [`session=${base64}`];
};

global.sellerSignIn = () => {
  // Build a JWT payload.  { id, email }
  // Use valid MongoDB ObjectId format (24-character hex string)
  const payload = {
    id: new mongoose.Types.ObjectId().toHexString(),
    email: 'seller@test.com',
    role: 'seller',
  };

  // Create the JWT!
  const token = jwt.sign(payload, process.env.JWT_KEY!);

  // Build session Object. { jwt: MY_JWT }
  const session = { jwt: token };

  // Turn that session into JSON
  const sessionJSON = JSON.stringify(session);

  // Take JSON and encode it as base64
  const base64 = Buffer.from(sessionJSON).toString('base64');

  // return a string thats the cookie with the encoded data
  return {
    token: [`session=${base64}`],
    payload,
  };
};
