import { RedisClientType } from "redis";
import { getRedisClient } from "../redisClient";

class RedisCache {
  private client: RedisClientType | null = null;

  private getClient(): RedisClientType {
    if (!this.client) {
      this.client = getRedisClient();
    }
    return this.client;
  }

  public async get(key: string): Promise<string | null> {
    console.log("Get data from cache", key);
    return await this.getClient().get(key);
  }

  public async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const serializedValue = JSON.stringify(value);
    if (ttlSeconds) {
      await this.getClient().set(key, serializedValue, { EX: ttlSeconds });
    } else {
      await this.getClient().set(key, serializedValue, { EX: this.calculateTTL(15, "minutes") });
    }
    console.log("Cache added", key);
  }

  public async del(key: string): Promise<void> {
    console.log("Cache deleted", key);
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
