# Product Service — Deep Review

**Date:** 2026-04-22  
**Branch:** feature/client-service  
**Reviewer:** Claude Code

---

## What's Working Well

- **`ProductAPIFeature`** is genuinely sophisticated — dual-mode pagination (cursor vs offset), stable sort via composite cursor `{value, id}`, field projection, and type-safe operator casting. This is beyond most tutorials.
- **Tiered cache TTLs** by query type show the right instinct (search = 60m, category = 10m).
- **RabbitMQ + typed events** via `@ecom-micro/common` is the right architectural call over REST-to-REST.
- **Test setup** with `mongodb-memory-server` + global helpers is clean.

---

## Real Problems (Bugs / Correctness)

### 1. Individual product cache TTL is 5 SECONDS — effectively useless
`src/routes/showProductDetailById.ts:30` — `calculateTTL(5, 'seconds')` means every request after 5s hits MongoDB. This was clearly set for testing and never changed. Should be at minimum 5–10 minutes.

### 2. No cache invalidation on writes
- `PATCH /api/product/:id` saves to Mongo and publishes an event, but never does `redisClient.del('product:' + id)`. The stale cached product will be served.
- `DELETE /api/product/:id` — same issue, deleted product lives in cache.
- `ProductQuantityUpdateListener` updates `product.quantity` in Mongo but doesn't touch Redis. Any in-flight cache returns wrong stock count.

### 3. MongoDB not awaited at startup
`src/index.ts:42-48` — `mongoose.connect(...).then().catch()` is fire-and-forget. The server starts on line 57 regardless of whether Mongo is connected. A request that arrives during the connection window will hit an unconnected DB.

### 4. `quantity` vs `stockQuantity` — two fields doing the same job
The schema has both. `ProductQuantityUpdateListener` only decrements `quantity`, but `newProduct.ts` creates with both. The semantic difference is never enforced anywhere in the codebase.

### 5. Seller can directly update `rating`
`src/routes/updateProduct.ts:39` — `rating: req.body.rating ? req.body.rating : product.rating` — a seller can POST any rating for their own product. Rating should only come from the review service via an event.

### 6. `redisClient` export inconsistency
`src/redisClient.ts` exports both `client as redisClient` (used in `showProduct.ts`) and `getRedisClient` (used in `showProductDetailById.ts`). If Redis hasn't connected yet and someone calls the named export, they get `undefined`. `getRedisClient()` at least throws explicitly.

### 7. Text index missing `description` and `tags`
`src/models/productModel.ts:102-108` — only `title` is in the text index. A search for "bluetooth" won't find a product whose title is "Headphones" but whose description says "bluetooth enabled". Tags are completely invisible to search.

---

## Architectural Gaps

### 8. No cache invalidation after list mutations
When a product is created/updated/deleted, cached list queries (`product_search:*`) still serve old data. You need either TTL-based expiry (current approach — acceptable but stale) or active invalidation by pattern (`SCAN` + `DEL product_search:*`).

### 9. No `ProductDeletedPub` event
When a product is deleted, the cart service still holds a reference to it. There's no event to trigger cart cleanup. The order service also holds historical references with no way to mark a product as discontinued.

### 10. RabbitMQ has no reconnect or graceful shutdown
`src/rabbitMQWrapper.ts` — one `amqp.connect()` with no retry, no exponential backoff, no `connection.on('close')` handler. In k8s, RabbitMQ restarts regularly. The product service just dies and needs a pod restart. Add `process.on('SIGTERM')` → `connection.close()` + graceful drain.

### 11. S3 client is recreated on every request
`src/services/uploadImageToAws.ts:10` — `new S3Client(...)` inside the function body. This means a new TCP connection pool per upload. Create the client once at module level.

### 12. No health/readiness endpoint
k8s liveness and readiness probes need `/healthz`. Currently the ingress will route traffic to a pod that's still connecting to Mongo/Redis/RabbitMQ.

---

## Next-Level Concepts to Learn From This Codebase

### A. Optimistic Concurrency Control (OCC)
Your `productQuantityUpdate` listener has a race condition: two cart orders arrive simultaneously, both read `quantity=1`, both pass the check, both decrement — you end up at -1.

Add a `version` field to the schema and use Mongoose's `findOneAndUpdate` with a version guard:

```ts
// Schema
version: { type: Number, default: 0 }

// Listener
await Product.findOneAndUpdate(
  { _id: data.id, version: data.version },  // optimistic lock
  { $inc: { quantity: -data.quantity }, $inc: { version: 1 } }
)
// If null → someone else updated first → nack + retry
```

This is the standard pattern for event-driven inventory.

### B. Redis Cache Invalidation Strategies

You're using **Cache-Aside** (check cache → miss → query DB → fill cache). The next level:

- **Write-Through**: on save, write to Redis + DB atomically. Complex but always consistent.
- **Cache-Aside + active invalidation**: on any write, `DEL` or `UNLINK` the relevant keys immediately. Much simpler, near-consistent.

For list caches (`product_search:*`), use Redis key namespacing + `UNLINK` by pattern on write, or accept eventual consistency with short TTLs.

### C. Compound Cursor Pagination — You've Done It Right
Your `buildPaginationCondition` with the `$or [{field > val}, {field == val AND _id > id}]` is the correct keyset pagination algorithm. Most engineers get this wrong (they just do `_id > cursor`).

The `$or` exists because when two documents share the same sort field value, the tiebreaker `_id` prevents skipped or duplicated records. The risk area is `prevKey` backward pagination — reversing the sort and then re-reversing results is subtle and often breaks when combined with filters. Write a dedicated test for this.

### D. Atlas Search vs MongoDB `$text`: When to Upgrade
MongoDB's `$text` operator cannot do:
- Fuzzy matching ("iphnoe" → iPhone)
- Synonyms ("mobile" → "phone", "cell phone")
- Faceted aggregations (count by category/price range alongside results)
- Weighted boosting by recency (score × recency factor)

Atlas Search (free tier available) uses Lucene under the hood and gives all of these with a `$search` aggregation stage. The migration path is straightforward since you already have the abstraction in `ProductAPIFeature.search()`.

### E. Aggregation Pipeline for Faceted Search
Right now your search returns products. What e-commerce apps actually need is "products + facet counts in one query" — like Amazon's sidebar (Electronics > 245, Books > 120, under $50 > 80). This requires a `$facet` aggregation:

```ts
db.products.aggregate([
  { $match: { $text: { $search: "cable" } } },
  { $facet: {
    results:     [{ $skip: 0 }, { $limit: 20 }],
    byCategory:  [{ $group: { _id: "$category", count: { $sum: 1 } } }],
    priceRanges: [{ $bucket: { groupBy: "$price", boundaries: [0, 50, 100, 500] } }],
    totalCount:  [{ $count: "total" }]
  }}
])
```

This replaces two round trips (search + counts) with one. `ProductAPIFeature` would need a `facet()` mode.

### F. CQRS at the Service Level
You're already doing read-heavy work (`ProductAPIFeature`) separate from writes. The next step: the *read model* and *write model* don't need to be the same MongoDB collection. The ETL service already syncs Mongo → Postgres. You could:

- Write events via RabbitMQ to a denormalized read replica (flat JSON, pre-joined with seller info)
- Serve all `GET /api/product` from that fast read store
- Only `POST/PATCH/DELETE` touch the source-of-truth Mongo collection

### G. Idempotent Consumers
`ProductQuantityUpdateListener` currently acks without checking if it already processed this exact message. If RabbitMQ redelivers a message (network hiccup after DB save but before ack), you'll double-decrement inventory.

Fix: store a `lastProcessedMessageId` per product, or use a separate `processedEvents` collection with a unique index on message ID.

### H. Graceful Shutdown

```ts
process.on('SIGTERM', async () => {
  await server.close();             // stop accepting new HTTP
  await mongoose.disconnect();      // flush pending writes
  await rabbitMQConnection.close(); // drain queued messages
  process.exit(0);
});
```

k8s sends `SIGTERM` before killing a pod. Without this, in-flight requests get dropped and RabbitMQ messages are nacked.

---

## Priority Order to Fix

| Priority | Issue | File | Impact |
|---|---|---|---|
| P0 | Cache invalidation on write (update/delete/quantity) | `updateProduct.ts`, `deleteProduct.ts`, `productQuantityUpdate.ts` | Correctness — wrong data served |
| P0 | MongoDB startup not awaited | `index.ts:42` | Correctness — crashes on cold start |
| P0 | Fix cache TTL for single product (5s → 5m) | `showProductDetailById.ts:30` | Performance |
| P1 | OCC for quantity listener | `productQuantityUpdate.ts` | Correctness — race condition in inventory |
| P1 | Add `ProductDeletedPub` | `deleteProduct.ts` | Event consistency across services |
| P1 | `rating` not settable by seller | `updateProduct.ts:39` | Security |
| P1 | Text index on `description` + `tags` | `productModel.ts:102` | Feature quality |
| P2 | S3 client singleton | `uploadImageToAws.ts:10` | Performance |
| P2 | RabbitMQ reconnect + SIGTERM handler | `rabbitMQWrapper.ts` | Resilience |
| P2 | Health endpoint `/healthz` | `app.ts` | k8s operability |
| P3 | Faceted search (`$facet`) | New route | Feature uplift |
| P3 | OCC → event sourcing → CQRS | Architecture evolution | Long-term scalability |
