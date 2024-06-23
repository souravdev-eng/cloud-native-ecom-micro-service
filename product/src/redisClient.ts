import { createClient, RedisClientType } from 'redis';

let client: RedisClientType;

const connectRedis = async (url: string) => {
  client = createClient({ url });

  client.on('connect', () => {
    console.log('Connected to Redis server...');
  });

  client.on('error', (err) => {
    console.error('Redis error:', err);
  });

  await client.connect();
};

const getRedisClient = (): RedisClientType => {
  if (!client) {
    throw new Error('Redis client not initialized. Call connectRedis first.');
  }
  return client;
};

export { connectRedis, getRedisClient };
