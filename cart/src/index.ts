import app from "./app";
import { rabbitMQWrapper } from "./rabbitMQWrapper";
import { ProductDeleteListener } from "./queues/listener/productDeleteListener";
import { ProductCreatedListener } from "./queues/listener/productCreatedListener";
import { ProductUpdatedListener } from "./queues/listener/productUpdatedListener";
import { ProductQuantityUpdateListener } from "./queues/listener/productQuantityUpdate";
import { OrderCreatedListener } from "./queues/listener/orderCreatedListener";
import { initializeDatabase } from "./dbConfig";

const start = async () => {
  if (!process.env.RABBITMQ_ENDPOINT) {
    throw new Error("RABBITMQ_ENDPOINT must be defined");
  }

  await initializeDatabase();

  await rabbitMQWrapper.connect(process.env.RABBITMQ_ENDPOINT!);
  await new ProductDeleteListener(rabbitMQWrapper.channel).listen();
  await new ProductCreatedListener(rabbitMQWrapper.channel).listen();
  await new ProductUpdatedListener(rabbitMQWrapper.channel).listen();
  await new ProductQuantityUpdateListener(rabbitMQWrapper.channel).listen();
  await new OrderCreatedListener(rabbitMQWrapper.channel).listen();

  const PORT = parseInt(process.env.PORT ?? "4000", 10);
  const server = app.listen(PORT, () =>
    console.log(`Cart service running on PORT ${PORT}....`)
  );

  const shutdown = async () => {
    await rabbitMQWrapper.close();
    server.close(() => process.exit(0));
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
};

start().catch((error: any) => {
  console.error("CART STARTUP ERROR", error.message);
  process.exit(1);
});
