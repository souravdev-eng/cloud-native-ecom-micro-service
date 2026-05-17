import mongoose from "mongoose";
import app from "./app";
import { connectRedis } from "./redisClient";
import { rabbitMQWrapper } from "./rabbitMQWrapper";
import { ProductQuantityUpdateListener } from "./queues/listeners/productQuantityUpdate";
import { connectElasticsearch } from "./services/elasticClient";

const startRedisServer = async () => {
  try {
    await connectRedis(process.env.PRODUCT_REDIS_URL!);
  } catch (error) {
    console.error("Failed to connect to Redis:", error);
    process.exit(1);
  }
};

const start = async () => {
  if (!process.env.MONGO_USER) {
    throw new Error("Mongo DB User not found");
  }
  if (!process.env.PRODUCT_SERVICE_MONGODB_URL) {
    throw new Error("Mongo DB URL not found");
  }
  if (!process.env.MONGO_PASSWORD) {
    throw new Error("Mongo DB password not found");
  }

  if (!process.env.JWT_KEY) {
    throw new Error("JWT is not found");
  }

  if (!process.env.PRODUCT_REDIS_URL) {
    throw new Error("Redis URL not found");
  }

  if (!process.env.RABBITMQ_ENDPOINT) {
    throw new Error("RabbitMQ endpoint not found");
  }

  const PORT = process.env.PORT || 4000;

  try {
    mongoose.set("strictQuery", false);
    await mongoose.connect(process.env.PRODUCT_SERVICE_MONGODB_URL, {
      user: process.env.MONGO_USER,
      pass: process.env.MONGO_PASSWORD,
    });
    console.log("Product Service DB is connected");
    await rabbitMQWrapper.connect(process.env.RABBITMQ_ENDPOINT!);

    const listener = new ProductQuantityUpdateListener(rabbitMQWrapper.channel);
    await listener.listen();

    await startRedisServer();
    await connectElasticsearch();

    app.listen(PORT, () => {
      console.log(`Product server running on PORT ${PORT}`);
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Failed to start product service:", message);
    process.exit(1);
  }
};

const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} received. Closing connections...`);

  try {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  } catch (error) {
    console.error("Error closing MongoDB connection:", error);
  }

  try {
    await rabbitMQWrapper.close();
  } catch (error) {
    console.error("Error closing RabbitMQ connection:", error);
  }

  process.exit(0);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

start();
