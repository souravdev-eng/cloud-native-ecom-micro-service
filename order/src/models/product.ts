/* ============================================================================
 * MODEL — products  (LOCAL REPLICA, kept in sync by RabbitMQ listeners)
 * ============================================================================
 * Order must NOT call the product service at request time (a sync HTTP call
 * would couple the two services — if product is down, checkout breaks). So we
 * keep a LOCAL REPLICA of the product data we care about, kept up to date by
 * consuming Product events over RabbitMQ (see src/queue/listener/*).
 * This is the "database-per-service + event-carried state transfer" pattern;
 * the `cart` service does the same (cart/src/entity/Product.ts).
 *
 * The replica can only hold what the events carry. The message contract
 * (@ecom-micro/common → types/product.types.ts → ProductCreatedMessage) is:
 *     { id, title, price, image, sellerId, quantity,
 *       originalPrice, stockQuantity, category, tags }
 * To store MORE, extend the message + publisher in `common/` + `product/`
 * first, then add the column here.
 *
 * pgTable(sqlTableName, columnsObject) → a table object.
 *   • The JS key ("productId") is how you reference the column in code.
 *   • The string arg ("product_id") is the real SQL column name.
 * ========================================================================== */

import { integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const products = pgTable("products", {
  // The product's MongoDB _id (a 24-char hex string) is our primary key.
  // It is a STRING, not a real uuid — so we use varchar, not uuid().
  //   .primaryKey() → PRIMARY KEY (unique + not null + indexed).
  // We do NOT generate this id ourselves; it arrives inside the event.
  productId: varchar("product_id", { length: 255 }).primaryKey(),

  //   .notNull() → adds NOT NULL. Without it a column is nullable by default.
  title: varchar("title", { length: 255 }).notNull(),

  // Money as an INTEGER, stored in the SAME unit the product service emits
  // (whole currency units in this codebase). Using integers avoids float
  // rounding bugs. If product ever emits decimal prices, switch to
  // `numeric("price", { precision: 12, scale: 2 })` (note: numeric maps to a
  // JS string in drizzle, not number).
  price: integer("price").notNull(),
  originalPrice: integer("original_price").notNull(),

  image: varchar("image", { length: 1024 }).notNull(),
  sellerId: varchar("seller_id", { length: 255 }).notNull(),

  // .default("other") mirrors the product model's own default.
  category: varchar("category", { length: 255 }).notNull().default("other"),

  // Availability figures from the product side (kept for reads like
  // "is this still in stock?" without calling product).
  quantity: integer("quantity").notNull().default(0),
  stockQuantity: integer("stock_quantity").notNull().default(0),

  // text("tags").array() → a Postgres `text[]` column.
  //   .default([]) → DEFAULT '{}' (empty array). Great for a list of strings.
  //   (Alternative for nested/typed data would be jsonb(...).)
  tags: text("tags").array().notNull().default([]),

  // When this replica row was last written from an event. Useful for debugging
  // sync lag.
  //   timestamp(name, { withTimezone: true }) → `timestamptz`.
  //   .defaultNow()      → DEFAULT now() (DB fills it on INSERT).
  //   .$onUpdate(fn)     → drizzle runs fn() and sets the value on every UPDATE
  //                        issued THROUGH drizzle (app-side, not a DB trigger).
  syncedAt: timestamp("synced_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Inferred types — no hand-written interfaces to keep in sync.
//   $inferSelect → the row shape you READ back (all columns present).
//   $inferInsert → the shape you INSERT (defaults/nullable become optional).
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
