# Cart Service — Issue Audit

**Date:** 2026-04-29
**Branch:** feature/client-service
**Audited by:** Claude Code

---

## Priority Table

| # | Issue | File | Severity | Priority | Status |
|---|-------|------|----------|----------|--------|
| 1 | **Startup errors silently swallowed — service starts broken** | `src/index.ts:23-26` | Critical | P0 | Fixed |
| 2 | **`ProductUpdatedListener` never acks message when product not found** | `src/queues/listener/productUpdatedListener.ts:23-35` | Critical | P0 | Fixed |
| 3 | **`ProductCreatedListener` has no duplicate-event guard (no upsert)** | `src/queues/listener/productCreatedListener.ts:26-36` | High | P1 | Fixed |
| 4 | **`AppDataSource` never initialized in test setup — `newCart` tests fail** | `src/routes/newCart.ts:20,43` vs `src/test/setup.ts` | High | P1 | Fixed |
| 5 | **Missing `quantity` input validation — allows `0`, negative, or non-integer** | `src/validation/cartValidationSchema.ts` | High | P1 | Fixed |
| 6 | **PORT is hardcoded to `4000`** (product service was fixed; cart was not) | `src/index.ts:26` | Medium | P2 | Fixed |
| 7 | **`synchronize: true` in production DataSource config** | `src/dbConfig.ts:10` | Medium | P2 | Fixed |
| 8 | **`oldVersion` declared but never used — broken optimistic locking intent** | `src/routes/newCart.ts:78` | Medium | P2 | Fixed |
| 9 | **CORS hardcoded to localhost — blocks production k8s traffic** | `src/app.ts:18-27` | Medium | P2 | Fixed |
| 10 | **No graceful shutdown — RabbitMQ connection reference not stored** | `src/rabbitMQWrapper.ts` | Medium | P2 | Fixed |
| 11 | **Debug endpoint `/api/cart/product` exposed without authentication** | `src/app.ts:42-46` | Medium | P2 | Fixed |
| 12 | **Inconsistent DataSource usage (`dbClient.getRepository()` vs `BaseEntity` statics)** | `src/routes/newCart.ts`, `deleteCart.ts`, `showAllCart.ts` | Medium | P2 | Fixed |
| 13 | **`jsonwebtoken` + `@types/jsonwebtoken` duplicated in both `dependencies` and `devDependencies`** | `package.json:36-37,43-44` | Low | P3 | Fixed |
| 14 | **`@ecom-micro/common` version drift (`^2.0.48` vs published `2.0.51`)** | `package.json:22` | Low | P3 | Fixed |
| 15 | **`console.log` used for startup errors instead of `console.error`** | `src/index.ts:24` | Low | P3 | Fixed |
| 16 | **`__mocks__/rabbitMQWrapper.ts` duplicates the inline `jest.mock()` in `setup.ts`** | `src/__mocks__/rabbitMQWrapper.ts` | Low | P3 | Fixed |

---

## P0 — Critical

### #1 — Startup errors silently swallowed

**File:** `src/index.ts:23-26`

The `start()` function wraps DB and RabbitMQ initialization in a `try/catch` that only logs the error, then unconditionally calls `app.listen()`. A failed DB or MQ connection still starts the HTTP server — every subsequent request hits an uninitialized DataSource and will crash at the handler level with an unhelpful 500.

```ts
// current — broken
} catch (error: any) {
  console.log("CART DB ERROR", error.message); // swallowed
}
app.listen(4000, ...); // always runs
```

**Fix:** re-throw the error (or call `process.exit(1)`) inside the catch so the process does not start serving traffic without a working DB.

---

### #2 — `ProductUpdatedListener` never acks message when product not found

**File:** `src/queues/listener/productUpdatedListener.ts:23-35`

When `Product.findOneBy({ id })` returns `null`, the handler returns without calling `channel.ack(msg)`. RabbitMQ will redeliver the message indefinitely, stalling the entire consumer queue.

```ts
// current — missing ack in the else branch
if (product) {
  // ...
  channel.ack(msg);
}
// no else → message never acked if product missing
```

**Fix:** add `channel.ack(msg)` (or `channel.nack(msg, false, false)` to dead-letter) in the `else` branch.

---

## P1 — High

### #3 — `ProductCreatedListener` has no duplicate-event guard

**File:** `src/queues/listener/productCreatedListener.ts:26-36`

`Product.create({id: ...}).save()` will throw a unique-constraint violation if the same `ProductCreated` event is delivered more than once. RabbitMQ guarantees at-least-once delivery, so duplicates are expected under failures and restarts.

**Fix:** use TypeORM `upsert()` or check `Product.findOneBy({ id })` before inserting.

---

### #4 — `AppDataSource` never initialized in test setup — `newCart` route tests silently fail

**Files:** `src/routes/newCart.ts:20,43`, `src/test/setup.ts`

The test setup initializes a pg-mem-backed `DataSource` which sets `Cart.dataSource` and `Product.dataSource` to the pg-mem instance. However, `newCart.ts` calls `dbClient.getRepository()` where `dbClient = AppDataSource` — a completely separate DataSource object that is never initialized in tests. TypeORM throws `DataSource is not initialized`, causing all `POST /api/cart` route tests to return 500 instead of the expected 201/200/400.

`showAllCart.ts` and `deleteCart.ts` use `BaseEntity` static methods (which do use the pg-mem datasource), making those tests pass while `newCart` tests silently fail.

**Fix:** either patch `AppDataSource` in test setup to point to the pg-mem datasource, or standardize all routes to use `BaseEntity` static methods consistently.

---

### #5 — Missing `quantity` input validation

**File:** `src/validation/cartValidationSchema.ts`

The schema only validates `productId`. A payload with `quantity: 0`, `quantity: -5`, or `quantity: "abc"` bypasses schema validation entirely. The route only checks `quantity > product.quantity`, so `quantity: 0` or a negative value creates a corrupt cart row.

```ts
// current — only productId validated
export const cartValidation = [
  body('productId').not().isEmpty().withMessage('Cart must have a productId'),
];
```

**Fix:** add `body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer')` and apply `cartValidation` middleware to the route.

> **Note:** `cartValidation` is defined but never imported or used in `newCart.ts` — the route only uses `requestValidation` from `@ecom-micro/common`.

---

## P2 — Medium

### #6 — PORT hardcoded to `4000`

**File:** `src/index.ts:26`

```ts
app.listen(4000, () => console.log(`Cart service running on PORT 4000....`));
```

The product service was recently fixed (commit `1d90573`) to use a configurable `PORT` env var. Cart was not updated. This blocks deploying the service on a different port without rebuilding.

**Fix:** `const PORT = parseInt(process.env.PORT ?? '4000', 10);`

---

### #7 — `synchronize: true` in production DataSource

**File:** `src/dbConfig.ts:10`

TypeORM's `synchronize: true` auto-runs DDL against the live database on every startup. Any column rename or removal will silently drop data. This must be `false` in production; use explicit migrations instead.

---

### #8 — `oldVersion` declared but never used

**File:** `src/routes/newCart.ts:78`

```ts
const oldVersion = existingCart.version; // declared, never read
existingCart.quantity = quantity;
await existingCart.save();
```

This strongly suggests optimistic locking / version-conflict detection was planned but not implemented. Concurrent updates can silently overwrite each other.

**Fix:** either implement version conflict checking or remove the dead variable.

---

### #9 — CORS hardcoded to localhost

**File:** `src/app.ts:18-27`

```ts
origin: [
  "http://localhost:3000",
  ...
],
```

In k8s (behind NGINX ingress), requests come from the cluster's ingress domain, not localhost. This blocks all cross-origin requests from the real frontend in production.

**Fix:** read the allowed origins from an environment variable.

---

### #10 — No graceful shutdown for RabbitMQ

**File:** `src/rabbitMQWrapper.ts`

The `RabbitMQWrapper` stores the channel but not the connection. There is no `close()` method, and no `SIGTERM`/`SIGINT` handler in `index.ts`. The product service was recently patched for this (commit `1d90573`); cart was not.

**Fix:** store the `connection` reference and add a `close()` method called on process signals.

---

### #11 — Unauthenticated debug endpoint leaks all product data

**File:** `src/app.ts:42-46`

```ts
app.get("/api/cart/product", async (req, res) => {
  const product = await productRepository.find(); // no auth
  res.send(product);
});
```

This endpoint returns the full local product replica to any unauthenticated caller. It should be removed or protected with `requireAuth`.

---

### #12 — Inconsistent DataSource usage across routes

**Files:** `src/routes/newCart.ts`, `deleteCart.ts`, `showAllCart.ts`

- `newCart.ts` uses `dbClient.getRepository()` for some operations and `Cart.findOne()` (BaseEntity) for others.
- `deleteCart.ts` and `showAllCart.ts` use only `BaseEntity` static methods.

This inconsistency makes the codebase hard to reason about and is the root cause of issue #4.

**Fix:** standardize on one approach — preferably `BaseEntity` statics, which work correctly with the existing test setup.

---

## P3 — Low

### #13 — Duplicate package entries

**File:** `package.json:36-37,43-44`

`jsonwebtoken` and `@types/jsonwebtoken` appear in both `dependencies` and `devDependencies`. The `dependencies` entry wins at runtime but the duplication is confusing and can lead to version mismatches.

---

### #14 — `@ecom-micro/common` version drift

**File:** `package.json:22`

Cart pins `^2.0.48` while the published package is at `2.0.51`. New event types or fixes added in patch versions are not available until the dependency is bumped.

---

### #15 — `console.log` used for startup errors

**File:** `src/index.ts:24`

```ts
console.log("CART DB ERROR", error.message);
```

Errors should use `console.error` so they are correctly routed to stderr and captured by log aggregators (ELK stack is used in the `full` skaffold profile).

---

### #16 — Duplicate RabbitMQ mock

**Files:** `src/__mocks__/rabbitMQWrapper.ts`, `src/test/setup.ts:13-27`

The manual `jest.mock('../rabbitMQWrapper', ...)` call in `setup.ts` overrides the automatic `__mocks__` directory mock. Both exist with identical content, which is confusing and means the `__mocks__` file is dead code.

**Fix:** remove `src/__mocks__/rabbitMQWrapper.ts` and keep only the explicit `jest.mock()` in `setup.ts`, or vice versa.
