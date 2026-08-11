/* ============================================================================
 * RELATIONS (Drizzle 1.0 "Relations v2")
 * ============================================================================
 * Relations are an APP-LEVEL concept: they teach `db.query` how tables connect
 * so you can do nested reads like:
 *     db.query.orders.findMany({ with: { items: true } })
 *
 * They do NOT create foreign keys or any SQL — FKs live in schema.ts via
 * `.references()`. Because relations are decoupled from FKs, we can even
 * relate `orderItems.productId` → `products.productId` although there is no
 * database FK between them (see the snapshot note in schema.ts).
 *
 * defineRelations(schema, (r) => ({ ... })) takes the whole schema object and a
 * builder `r`. On `r` you get:
 *   • r.<tableName>.<columnName>   → a column reference (for `from` / `to`)
 *   • r.one.<tableName>({...})     → a to-ONE link (this row points at one row)
 *   • r.many.<tableName>()         → a to-MANY link (many rows point back here)
 * You describe BOTH sides; only the `one` side needs `from`/`to` columns.
 * ========================================================================== */

import { defineRelations } from "drizzle-orm";
import * as schema from "./index";

export const relations = defineRelations(schema, (r) => ({
  orders: {
    // one order has many items. The matching columns are declared on the
    // `one` side below, so `many` needs no from/to.
    items: r.many.orderItems(),
  },

  orderItems: {
    // each item belongs to exactly one order (the hard FK side).
    order: r.one.orders({
      from: r.orderItems.orderId, // local column
      to: r.orders.id, // target column
    }),

    // each item optionally maps to a row in the local product replica.
    // optional: true → the join may find nothing (replica not synced yet, or
    // product deleted) and `product` comes back undefined instead of erroring.
    product: r.one.products({
      from: r.orderItems.productId,
      to: r.products.productId,
      optional: true,
    }),
  },

  products: {
    // reverse side of the soft link above.
    orderItems: r.many.orderItems(),
  },
}));
