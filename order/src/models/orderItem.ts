/* ============================================================================
 * MODEL — order_items  (the lines of an order)
 * ============================================================================
 * KEY DESIGN DECISION — snapshot vs. live reference:
 *   • orderId  → HARD foreign key to orders.id. An item cannot exist without
 *                its parent order (composition); if the order is deleted its
 *                items go too (ON DELETE CASCADE).
 *   • productId → SOFT reference to products.productId with NO database FK.
 *                title/price below are a SNAPSHOT copied at purchase time.
 *                Why no FK and why snapshot?
 *                  – The product's price/title can change later, but a past
 *                    order must forever show what the customer actually paid.
 *                  – The replica row may be deleted (product removed) — an FK
 *                    would then block deletion or wipe order history. The
 *                    snapshot keeps order history self-contained.
 * ========================================================================== */

import { integer, pgTable, uuid, varchar } from "drizzle-orm/pg-core";
// Importing the sibling table lets us point the foreign key at it. The FK is
// declared with a thunk (below), so this import order never causes issues.
import { orders } from "./order";

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),

  // .references(() => orders.id, { onDelete: "cascade" })
  //   → FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE.
  //   The thunk `() => orders.id` defers evaluation so declaration order /
  //   circular references between tables don't matter.
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),

  // Soft reference only — deliberately NOT `.references(...)`. See note above.
  productId: varchar("product_id", { length: 255 }).notNull(),

  // Snapshot columns — frozen at the moment of purchase.
  title: varchar("title", { length: 255 }).notNull(),
  price: integer("price").notNull(), // unit price paid, minor units
  image: varchar("image", { length: 1024 }),
  quantity: integer("quantity").notNull().default(1),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
