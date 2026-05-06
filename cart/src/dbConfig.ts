import { DataSource, DataSourceOptions } from "typeorm";
import { Cart } from "./entity/Cart";
import { Product } from "./entity/Product";

const buildDataSourceOptions = (): DataSourceOptions => {
  const writeUrl = process.env.CART_DB_WRITE_URL;
  const readUrl = process.env.CART_DB_READ_URL;

  // If read replica URLs are provided, use replication config
  if (writeUrl && readUrl) {
    return {
      type: "postgres",
      replication: {
        master: { url: writeUrl },
        slaves: [{ url: readUrl }],
      },
      entities: [Cart, Product],
      synchronize: process.env.NODE_ENV !== "production",
    };
  }

  // Fallback: single connection (backward-compatible with existing setup)
  return {
    type: "postgres",
    port: 5432,
    url: process.env.CART_DB_URL!,
    entities: [Cart, Product],
    synchronize: process.env.NODE_ENV !== "production",
  };
};

export const AppDataSource = new DataSource(buildDataSourceOptions());

export const initializeDatabase = async () => {
  if (!process.env.CART_DB_URL && !process.env.CART_DB_WRITE_URL) {
    throw new Error("CART_DB_URL or CART_DB_WRITE_URL must be defined");
  }

  try {
    await AppDataSource.initialize();
    const mode = process.env.CART_DB_WRITE_URL ? "read-replica" : "single-instance";
    console.log(`Cart Postgres Server Started... (${mode} mode)`);
  } catch (err: any) {
    console.error(err.message);
    process.exit(1);
  }
};

export { AppDataSource as dbClient };
