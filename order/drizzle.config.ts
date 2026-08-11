import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// drizzle-kit runs on the host (not in-cluster), so it loads DB_URL
// from order/.env via dotenv above.
export default defineConfig({
  schema: "./src/models/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DB_URL!,
  },
});
