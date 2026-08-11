/* ============================================================================
 * MODEL — orders  (+ the order_status enum)
 * ========================================================================== */

import {
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/* pgEnum(sqlEnumName, [allowed values]) creates a real Postgres enum type. The
 * first arg is the type name stored in the DB; the array is the legal values.
 * Calling the result — orderStatus("status") — produces a COLUMN of that type. */
export const orderStatus = pgEnum("order_status", [
  "created", // order row exists, no payment attempted yet
  "awaiting_payment", // Stripe PaymentIntent created, not yet confirmed
  "paid", // payment succeeded
  "cancelled", // user/seller cancelled, or payment expired
  "complete", // fulfilled / delivered
]);

export const orders = pgTable("orders", {
  // uuid("id") → `uuid` column.
  //   .defaultRandom() → DEFAULT gen_random_uuid(); Postgres generates the id.
  //   .primaryKey()    → PRIMARY KEY.
  id: uuid("id").primaryKey().defaultRandom(),

  // Who placed the order. A string id coming from the auth service (soft ref,
  // no cross-service FK — you can't foreign-key across databases).
  userId: varchar("user_id", { length: 255 }).notNull(),

  // Enum column. .default("created") sets the DB DEFAULT; the value MUST be one
  // of the pgEnum values above (checked at compile time AND by Postgres).
  status: orderStatus("status").notNull().default("created"),

  // Order total in minor units. .default(0) so freshly-created orders are 0.
  totalAmount: integer("total_amount").notNull().default(0),

  // ISO-4217 currency code, always 3 chars.
  currency: varchar("currency", { length: 3 }).notNull().default("INR"),

  // Nullable on purpose: null until we create the Stripe PaymentIntent.
  // (No .notNull() = the column is nullable.)
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
