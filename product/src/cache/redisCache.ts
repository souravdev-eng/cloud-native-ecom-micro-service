import { RedisClientType } from "redis";
import { getRedisClient } from "../redisClient";

class RedisCache {
  // Cache implementation for Redis
  private client: RedisClientType | null = null;

  private getClient(): RedisClientType {
    if (!this.client) {
      this.client = getRedisClient();
    }
    return this.client;
  }

  public async get(key: string): Promise<string | null> {
    const cachedData = await this.getClient().get(key);
    return cachedData ? JSON.parse(cachedData) : null;
  }

  public async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const serializedValue = JSON.stringify(value);
    if (ttlSeconds) {
      await this.getClient().set(key, serializedValue, { EX: ttlSeconds });
    } else {
      await this.getClient().set(key, serializedValue, { EX: this.calculateTTL(15, "minutes") });
    }
  }

  public async del(key: string): Promise<void> {
    await this.getClient().del(key);
  }

  private calculateTTL(value: number, timeUnit: "seconds" | "minutes" | "hours"): number {
    switch (timeUnit) {
      case "seconds":
        return value;
      case "minutes":
        return value * 60;
      case "hours":
        return value * 3600;
      default:
        throw new Error('Invalid time unit. Use "seconds", "minutes", or "hours".');
    }
  }
}

export const cache = new RedisCache();
