# 09 — Bulk Index from MongoDB (skeleton)

> **Status: skeleton.** This example illustrates the **shape** of a Mongo
> → ES bulk indexer using the outbox pattern. It does **not** connect
> to the real `product/` Mongo database. The data source is an
> in-memory iterable that fakes a Mongo cursor.

What the real version would do, in order:

1. Service writes to Mongo + outbox collection in **one transaction**.
2. A relay tails the outbox (or uses Mongo change streams) and publishes
   `product:created/updated/deleted` events to RabbitMQ — same exchange
   the platform already uses (see `sandbox/rabbitmq-learning/`).
3. A small **search-indexer** service subscribes to those events and
   bulk-indexes them into ES, using the `_id` of the Mongo doc as the
   ES `_id` (so `index` ops are idempotent).
4. A periodic full-resync job (this file's pattern) backfills missed
   documents — a safety net, not the main path.

## Run

```bash
npm run bulk-from-mongo
```

## What to notice

- We disable `refresh_interval` and `replicas` during the bulk load and
  restore them after — the standard "10x faster reindex" trick from
  chapter 08.
- `helpers.bulk` returns counts of `successful`, `failed`, `retry`. In
  production: log all of these and alert on `failed > 0`.
- The same code shape works for the real Mongo flow — replace
  `fakeMongoCursor` with a `findCursor` over a Mongo collection.
