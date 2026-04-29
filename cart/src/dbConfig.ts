import { DataSource } from "typeorm";
import { Cart } from "./entity/Cart";
import { Product } from "./entity/Product";

export const AppDataSource = new DataSource({
  type: "postgres",
  port: 5432,
  url: process.env.CART_DB_URL!,
  entities: [Cart, Product],
  synchronize: process.env.NODE_ENV !== 'production',
});

export const initializeDatabase = async () => {
  if (!process.env.CART_DB_URL) {
    throw new Error("CART_DB_URL must be defined");
  }

  try {
    await AppDataSource.initialize();
    console.log("Cart Postgres Server Started...");
  } catch (err: any) {
    console.error(err.message);
    process.exit(1);
  }
};

export { AppDataSource as dbClient };
