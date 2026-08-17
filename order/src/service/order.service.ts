/* ============================================================================
 * SERVICE — order business logic
 * ============================================================================
 * Routes stay thin: they validate + authorize, then call into here. Everything
 * that touches the DB or decides business rules lives in this file, so it can
 * be unit-tested without HTTP.
 * ========================================================================== */

import { BadRequestError, NotFoundError } from "@ecom-micro/common";

import { db } from "../db";
import { config } from "../config";
import { NewOrderItem, Order, OrderItem, orderItems, orders } from "../models";
import { CreateOrderInput } from "../types/order.types";

export type OrderWithItems = Order & { items: OrderItem[] };

/* ----------------------------------------------------------------------------
 * createOrder — the whole checkout write path, in 4 phases:
 *
 *   PHASE 1  normalise the request      (merge duplicate lines)
 *   PHASE 2  load the real products     (one query, from OUR replica)
 *   PHASE 3  validate + price the order (the trust boundary)
 *   PHASE 4  write it                   (one transaction)
 *
 * THE ONE RULE TO REMEMBER: the request body is untrusted input. It may only
 * tell us WHICH product and HOW MANY. Title, price and availability are always
 * read from the database — otherwise a user could POST `price: 1` and buy a
 * laptop for one rupee. That is why phase 2 comes before phase 3.
 * -------------------------------------------------------------------------- */
export const createOrder = async (
  userId: string,
  input: CreateOrderInput,
): Promise<OrderWithItems> => {
  /* ---- PHASE 1: normalise ------------------------------------------------
   * A client can legitimately send the same product twice:
   *     items: [{ p1, qty 1 }, { p1, qty 2 }]
   * If we processed those as two separate lines, EACH would be checked against
   * stock on its own — 1 <= 2 available, 2 <= 2 available — and we'd happily
   * sell 3 units of a product with 2 in stock. Merging first means we check the
   * real total (3) once.
   *
   * A Map is used instead of a plain object because it keeps insertion order
   * and has clean .get/.set/.keys(). Shape: Map<productId, totalQuantity>.
   * `?? 0` = "the value if we've seen this id before, otherwise start at 0".  */
  const requested = new Map<string, number>();
  for (const item of input.items) {
    requested.set(item.productId, (requested.get(item.productId) ?? 0) + item.quantity);
  }

  /* ---- PHASE 2: load the real products -----------------------------------
   * ONE query for all ids, not one query per item inside a loop (that's the
   * classic N+1 problem — 20 items would mean 20 round trips).
   *
   * `[...requested.keys()]` spreads the Map's keys into a plain array of ids,
   * which is what the `in` filter needs. In SQL this becomes:
   *     SELECT * FROM products WHERE product_id IN ($1, $2, ...)
   *
   * Remember this reads the LOCAL replica that the RabbitMQ listeners keep in
   * sync — we never make an HTTP call to the product service at checkout time
   * (see the header comment in models/product.ts for why).                   */
  const productsList = await db.query.products.findMany({
    where: {
      productId: {
        in: [...requested.keys()],
      },
    },
  });

  /* The query returns an ARRAY in whatever order Postgres felt like. Looking up
   * an id in an array means scanning it every time (.find() = O(n)); building a
   * Map<productId, product> once gives O(1) lookups in the loop below.        */
  const byId = new Map(productsList.map((p) => [p.productId, p]));

  /* If the client asked for 3 ids and the DB only returned 2, one is unknown to
   * us — either a bad id, or a product whose event hasn't reached this replica.
   * Fail loudly instead of silently dropping the line from the order: the user
   * must never be charged for fewer items than they thought they bought.      */
  const missing = [...requested.keys()].filter((id) => !byId.has(id));
  if (missing.length) {
    // Throwing is safe here — `express-async-errors` routes it to errorHandler,
    // which turns a common error class into its proper JSON + status code.
    throw new NotFoundError(`Product not found: ${missing.join(", ")}`);
  }

  /* ---- PHASE 3: validate + price -----------------------------------------
   * `lines` collects the rows we're about to insert into order_items.
   * The type is Omit<NewOrderItem, "orderId"> — "an order item minus orderId" —
   * because the order doesn't exist yet, so we don't have its id until phase 4.
   *
   * NOTE we build everything in memory FIRST and only touch the DB at the end.
   * If item #5 is out of stock we throw before a single row was written, so
   * there is nothing to clean up.                                             */
  const lines: Omit<NewOrderItem, "orderId">[] = [];
  let totalAmount = 0;

  // Destructuring a Map in a for..of gives you [key, value] on each pass.
  for (const [productId, quantity] of requested) {
    // The `!` (non-null assertion) tells TypeScript "this is definitely here".
    // It is only honest because the `missing` check above already proved every
    // requested id is in the Map. Never write `!` without that kind of proof.
    const product = byId.get(productId)!;

    /* Availability check. We read `quantity`, NOT `stockQuantity`: quantity is
     * the column ProductQuantityUpdateListener refreshes on every sale, while
     * stockQuantity only changes on a full product create/update resync and so
     * goes stale between sales.
     *
     * IMPORTANT — this is a fast rejection, not a reservation. The replica is
     * eventually consistent, so two people checking out the last unit at the
     * same moment will BOTH pass this check. Real enforcement has to happen on
     * the product service when it consumes our OrderCreated event.            */
    if (product.quantity < quantity) {
      throw new BadRequestError(
        `Only ${product.quantity} left of "${product.title}"`,
      );
    }

    /* The SNAPSHOT. title/price/image are copied from the product row into the
     * order line, frozen forever. If the seller raises the price tomorrow, this
     * order still shows what was actually paid today (see orderItem.ts).       */
    lines.push({
      productId,
      title: product.title,
      price: product.price,
      image: product.image,
      quantity,
    });

    // Server-side total. Integer maths only — see the money note in product.ts.
    totalAmount += product.price * quantity;
  }

  /* ---- PHASE 4: write ----------------------------------------------------
   * db.transaction(cb) opens BEGIN, runs the callback, and COMMITs if it
   * returns — or ROLLBACKs if anything throws. Inside you MUST use `tx`, not
   * `db`: a query issued on `db` runs on a different connection, outside the
   * transaction, and would survive the rollback.
   *
   * Why it matters here: without the transaction, a failure on the second
   * insert would leave an order row with zero items — an order that charges the
   * user for nothing. Both rows land, or neither does.
   *
   * We return the callback's value, which db.transaction() passes back out.   */
  return db.transaction(async (tx) => {
    /* .returning() makes Postgres send the inserted row(s) back (SQL:
     * `INSERT ... RETURNING *`), which is how we learn the values the DATABASE
     * generated — the uuid id, createdAt, and any column defaults. Without it
     * we'd have no id to attach the items to.
     *
     * It always returns an ARRAY, so `const [order]` destructures the first
     * (and here only) row out of it.                                          */
    const [order] = await tx
      .insert(orders)
      .values({
        userId,
        status: "created", // no payment attempted yet — see the orderStatus enum
        totalAmount,
        currency: config.DEFAULT_CURRENCY,
      })
      .returning();

    /* Now that the order has an id, stamp it onto every line. Passing an ARRAY
     * to .values() inserts all rows in ONE statement (not one INSERT per item).
     * `{ ...line, orderId: order.id }` copies the line and adds the FK field.  */
    const items = await tx
      .insert(orderItems)
      .values(lines.map((line) => ({ ...line, orderId: order.id })))
      .returning();

    // `{ ...order, items }` = the order's own columns plus the items array,
    // which is exactly the OrderWithItems shape the route sends to the client.
    return { ...order, items };
  });
};

/**
 * Lists the caller's orders, newest first. Paginate with limit/offset — never
 * return every order of a long-lived account in one response.
 */
export const listOrdersByUser = async (
  userId: string,
  opts: { limit: number; offset: number },
): Promise<OrderWithItems[]> => {
  // TODO: db.query.orders.findMany({ where: { userId }, with: { items: true },
  //       orderBy: { createdAt: "desc" }, limit, offset })
  throw new Error("listOrdersByUser not implemented");
};

/**
 * Fetches one order WITH its items. Takes userId so ownership is enforced in
 * the query itself — never fetch by id and check the owner afterwards.
 */
export const getOrderById = async (
  orderId: string,
  userId: string,
): Promise<OrderWithItems | undefined> => {
  // TODO: db.query.orders.findFirst({ where: { id: orderId, userId }, with: { items: true } })
  throw new Error("getOrderById not implemented");
};

/**
 * Cancels an order. Only "created" / "awaiting_payment" orders may be
 * cancelled — a "paid" order needs a refund flow, not a status flip.
 */
export const cancelOrder = async (
  orderId: string,
  userId: string,
): Promise<OrderWithItems> => {
  // TODO: load + guard the current status, then
  //       db.update(orders).set({ status: "cancelled" }).where(...).returning()
  // TODO: if a PaymentIntent exists, cancel it at Stripe too (payment.service)
  throw new Error("cancelOrder not implemented");
};

/**
 * Applies a Stripe outcome to the order — called by the webhook route.
 * Must be idempotent: Stripe retries the same event, so re-applying "paid"
 * to an already-paid order should be a no-op, not an error.
 */
export const markOrderPaid = async (
  paymentIntentId: string,
): Promise<void> => {
  // TODO: db.update(orders).set({ status: "paid" })
  //       .where(and(eq(orders.stripePaymentIntentId, pi), ne(orders.status, "paid")))
  throw new Error("markOrderPaid not implemented");
};
