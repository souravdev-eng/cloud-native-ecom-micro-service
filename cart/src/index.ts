import app from "./app";
import { rabbitMQWrapper } from "./rabbitMQWrapper";
import { ProductDeleteListener } from "./queues/listener/productDeleteListener";
import { ProductCreatedListener } from "./queues/listener/productCreatedListener";
import { ProductUpdatedListener } from "./queues/listener/productUpdatedListener";
import { ProductQuantityUpdateListener } from "./queues/listener/productQuantityUpdate";
import { initializeDatabase } from "./dbConfig";

const start = async () => {
  if (!process.env.RABBITMQ_ENDPOINT) {
    throw new Error("RABBITMQ_ENDPOINT must be defined");
  }

  try {
    await initializeDatabase();

    await rabbitMQWrapper.connect(process.env.RABBITMQ_ENDPOINT!);
    // Set up product event listeners
    await new ProductDeleteListener(rabbitMQWrapper.channel).listen();
    await new ProductCreatedListener(rabbitMQWrapper.channel).listen();
    await new ProductUpdatedListener(rabbitMQWrapper.channel).listen();
    await new ProductQuantityUpdateListener(rabbitMQWrapper.channel).listen();
  } catch (error: any) {
    console.log("CART DB ERROR", error.message);
  }
  app.listen(4000, () => console.log(`Cart service running on PORT 4000....`));
};

start();
