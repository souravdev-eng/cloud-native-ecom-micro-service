import { app } from "./app";
import { config } from "./config";
import { connectDB, pool } from "./db";
import { rabbitMQWrapper } from "./rabbitMQWrapper";
import { ProductCreatedListener } from "./queue/listener/productCreatedListener";
import { ProductUpdatedListener } from "./queue/listener/productUpdatedListener";
import { ProductDeleteListener } from "./queue/listener/productDeleteListener";
import { ProductQuantityUpdateListener } from "./queue/listener/productQuantityUpdateListener";

const startServer = async () => {
  try {
    await connectDB();

    // Connect to RabbitMQ, then start the listeners that keep the local
    // `products` replica in sync with the product service.
    await rabbitMQWrapper.connect(config.RABBITMQ_ENDPOINT);
    await new ProductCreatedListener(rabbitMQWrapper.channel).listen();
    await new ProductUpdatedListener(rabbitMQWrapper.channel).listen();
    await new ProductDeleteListener(rabbitMQWrapper.channel).listen();
    await new ProductQuantityUpdateListener(rabbitMQWrapper.channel).listen();

    const server = app.listen(config.PORT, () => {
      console.log(`Order Service running on port: ${config.PORT}`);
    });

    const shutdown = async () => {
      await rabbitMQWrapper.close();
      await pool.end();
      server.close(() => process.exit(0));
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (error) {
    console.error("Order startup error", error);
    process.exit(1);
  }
};

startServer();
