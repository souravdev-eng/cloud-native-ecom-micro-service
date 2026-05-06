/**
 * Migration: replace the title-only `TextSearch_title` text index on the
 * products collection with `ProductTextIndex` (title + tags + description,
 * weights 10 / 5 / 1).
 *
 * Why a script: MongoDB allows exactly one text index per collection.
 * Mongoose's `ensureIndex` / `autoIndex` will not reshape an existing
 * text index in place — it logs an error and leaves the old one. So a
 * deploy of the new schema definition alone is a no-op against a DB
 * that already has the old index.
 *
 * What this script does, idempotently:
 *   1. Connect to the product DB using the same env vars as the service.
 *   2. List existing indexes; drop `TextSearch_title` only if present.
 *   3. Run `Product.syncIndexes()` to create `ProductTextIndex` (and any
 *      other indexes declared in the schema that are missing).
 *
 * Usage:
 *   npm run migrate:text-index           (from product/)
 *
 * Safe to run multiple times. Safe to run while the service is up,
 * though there is a brief window between the drop and the create where
 * `$text` queries will fail — prefer running during a deploy window or
 * before rolling out the schema change.
 */

import mongoose from "mongoose";
import { Product } from "../models/productModel";

const OLD_INDEX_NAME = "TextSearch_title";
const NEW_INDEX_NAME = "ProductTextIndex";

async function run() {
  const url = process.env.PRODUCT_SERVICE_MONGODB_URL;
  const user = process.env.MONGO_USER;
  const pass = process.env.MONGO_PASSWORD;

  if (!url || !user || !pass) {
    throw new Error(
      "Missing one of PRODUCT_SERVICE_MONGODB_URL / MONGO_USER / MONGO_PASSWORD",
    );
  }

  mongoose.set("strictQuery", false);
  await mongoose.connect(url, { user, pass });
  console.log("[migrate] connected to product DB");

  const indexes = await Product.collection.indexes();
  const names = indexes.map((i) => i.name);
  console.log("[migrate] existing indexes:", names);

  if (names.includes(OLD_INDEX_NAME)) {
    console.log(`[migrate] dropping ${OLD_INDEX_NAME} ...`);
    await Product.collection.dropIndex(OLD_INDEX_NAME);
    console.log(`[migrate] dropped ${OLD_INDEX_NAME}`);
  } else {
    console.log(`[migrate] ${OLD_INDEX_NAME} not present — skipping drop`);
  }

  // syncIndexes will create any indexes declared on the schema that are
  // missing, and drop any indexes on the collection that are NOT in the
  // schema. The latter is destructive in general — it is safe here only
  // because every index in this collection is declared in productModel.ts.
  // If that ever stops being true, switch to ensureIndex per index.
  console.log("[migrate] running Product.syncIndexes() ...");
  const result = await Product.syncIndexes();
  console.log("[migrate] syncIndexes result:", result);

  const after = (await Product.collection.indexes()).map((i) => i.name);
  console.log("[migrate] indexes after:", after);

  if (!after.includes(NEW_INDEX_NAME)) {
    throw new Error(
      `Expected ${NEW_INDEX_NAME} to exist after migration but it does not`,
    );
  }

  console.log("[migrate] done");
}

run()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("[migrate] failed:", err);
    await mongoose.disconnect().catch(() => undefined);
    process.exit(1);
  });
