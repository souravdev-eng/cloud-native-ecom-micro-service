import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { config } from "../config";
import { relations } from "../models/relations";
import * as schema from "../models";

// Neon Postgres — SSL is driven by the sslmode param in DB_URL.
export const pool = new Pool({ connectionString: config.ORDER_DB_URL });

// Relations v2: pass `relations` so db.query.* is available.
export const db = drizzle({ client: pool, relations });

export const connectDB = async () => {
  await pool.query("SELECT 1");
  console.log("Order Postgres (Drizzle) connected...");
};

export type DB = typeof db;
export { schema };
