# 08 — Indexing & Sync

## What problem does this solve?

In real systems, **MongoDB or Postgres is the source of truth**.
Elasticsearch is a read-only projection used for search. Two questions:

1. How do I get a million docs into ES quickly without melting the
   cluster? → **Bulk API + refresh tuning.**
2. How do I keep ES in sync with the source of truth, so search results
   reflect what was just written? → **Outbox pattern, change streams,
   aliases for migrations.**

This chapter is about both.

## The minimal mental model

### 1. Bulk API — the only sane way to load data

Single-doc indexing is fine for one-off writes; it is hopeless for bulk.
Each request has TCP, JSON parse, refresh, and replication overhead.
With `_bulk` you batch hundreds of operations into one HTTP request.

```http
POST /_bulk
{ "index": { "_index": "products", "_id": "p_1" } }
{ "title": "Red Running Shoes", "price": 89.99 }
{ "index": { "_index": "products", "_id": "p_2" } }
{ "title": "Shoe Polish", "price": 4.50 }
{ "delete": { "_index": "products", "_id": "p_3" } }
```

Notes:

- It is NDJSON: a meta line then a doc line, one pair per op. **Trailing
  newline required.**
- 4 operation types: `index` (create or replace), `create` (fail if
  exists), `update`, `delete`.
- Each op can fail independently. Always check `response.errors === true`
  and log the per-item errors. Common cause: mapping conflict.

The `@elastic/elasticsearch` client has a `helpers.bulk` that streams
your data, batches it, retries failures, and rate-limits. Use it.

```ts
import { Client } from "@elastic/elasticsearch";

const client = new Client({ node: process.env.ELASTIC_URL });

await client.helpers.bulk({
  datasource: products,                      // any iterable
  onDocument: (doc) => ({
    index: { _index: "products", _id: doc.id }
  }),
  flushBytes: 5_000_000,                     // 5MB batches
  concurrency: 4,
  refreshOnCompletion: true
});
```

### 2. Refresh — the speed knob you usually ignore

ES makes documents searchable on **refresh**, by default every 1 second.
For a bulk load, refreshing during the load is wasted work.

```ts
// before bulk:
await client.indices.putSettings({
  index: "products",
  body: { index: { refresh_interval: "-1", number_of_replicas: 0 } }
});

// ... bulk index ...

// after bulk:
await client.indices.putSettings({
  index: "products",
  body: { index: { refresh_interval: "1s", number_of_replicas: 1 } }
});
await client.indices.refresh({ index: "products" });
```

Disabling refresh and replicas during a bulk load is the standard
"reindex 10x faster" trick. Re-enable both before traffic.

### 3. Aliases — the zero-downtime reindex story

You do not change a mapping. You build a new index and switch.

```
clients always read/write through alias  →  products
                                            ├──> products_v1   (live, today)
                                            └──> products_v2   (being built)
```

The flow:

1. Create `products_v2` with the new mapping.
2. Reindex from `products_v1` to `products_v2` (`_reindex` API or stream
   from source-of-truth via bulk).
3. (Optional) catch up any writes that happened during reindex (see
   "dual write window" below).
4. Atomically swap the alias:

```json
POST /_aliases
{
  "actions": [
    { "remove": { "index": "products_v1", "alias": "products" } },
    { "add":    { "index": "products_v2", "alias": "products" } }
  ]
}
```

5. Wait, watch metrics. Then drop `products_v1` (or keep for rollback).

The client never knew anything happened. **All client code reads/writes
the alias `products`, never the concrete index.** This is non-negotiable
in production.

### 4. Syncing from MongoDB — three patterns, ranked

| Pattern | How it works | Use when |
|---------|--------------|----------|
| **Dual write** | Service writes to Mongo, then writes to ES | Never, except prototypes |
| **Change stream tail** | A consumer tails Mongo's `oplog`/change stream and writes to ES | Single-source DB, you own the consumer |
| **Outbox + event bus** | Service writes to Mongo + an `outbox` table in same transaction; a relay publishes events; ES indexer subscribes | Multi-service, you already have RabbitMQ |

Why dual write is bad: it is two writes with no transaction. If ES is
slow or down, you must either fail the user request or quietly drop
search index updates. Both are painful.

#### Outbox in this codebase

This platform already runs RabbitMQ (`sandbox/rabbitmq-learning/`) and
publishes `product:created/updated/deleted` events from `product/`. The
outbox shape:

```
[product service]
  ├── write product → Mongo (transactionally)
  └── write event   → outbox collection (same transaction)

[outbox relay] (cron / change-stream)
  └── publishes events from outbox to RabbitMQ

[search indexer] (separate small service)
  └── subscribes; bulk-indexes into ES; commits offset on success
```

Important properties:

- **At-least-once delivery.** The indexer must be idempotent — index by
  document id, not append. ES `index` op (with `_id`) is naturally
  idempotent.
- **Order matters per id, not globally.** Use the doc id as the
  partition key.
- **Failure is visible.** A backlog in the outbox or queue is observable;
  silent drops are not.

### 5. Reindex API — server-side bulk copy

If both indices are on the same cluster:

```json
POST /_reindex
{
  "source": { "index": "products_v1" },
  "dest":   { "index": "products_v2" }
}
```

It is a regular ES task and runs in the background. Slice it for
parallelism:

```json
{ "source": { "index": "products_v1", "slice": { "id": 0, "max": 4 } } }
```

(then run 4 of these in parallel). On a few-million-doc index this
typically goes 4-10x faster.

If the source is **MongoDB**, the reindex must come from outside ES —
that's the bulk-index-from-mongo example.

### 6. Capturing the "during-reindex writes" gap

Two safe options:

**Option A — pause writes briefly** (only viable if you have downtime budget):

1. Stop search-write consumers.
2. Reindex.
3. Swap alias.
4. Resume consumers; they catch up from the queue.

**Option B — dual-write the reindex window** (preferred):

1. Start dual-writing to `products_v1` AND `products_v2`.
2. Reindex `v1 → v2` for the historical backfill.
3. Verify counts and a few sampled docs.
4. Swap alias.
5. Stop dual-writing.

Option B works because by the time the swap happens, every new write has
already gone to v2. The historical tail is filled by reindex.

## Concrete example — bulk loading from a JSON file

```ts
import { readFile } from "node:fs/promises";
import { Client } from "@elastic/elasticsearch";

const client = new Client({ node: process.env.ELASTIC_URL ?? "http://localhost:9200" });

async function bulkLoad() {
  const raw = await readFile("./seed/products.json", "utf8");
  const docs: Array<{ id: string }> = JSON.parse(raw);

  await client.indices.putSettings({
    index: "products",
    body: { index: { refresh_interval: "-1" } }
  });

  const result = await client.helpers.bulk({
    datasource: docs,
    onDocument: (doc) => ({ index: { _index: "products", _id: doc.id } }),
    flushBytes: 5_000_000,
    concurrency: 4
  });

  await client.indices.putSettings({
    index: "products",
    body: { index: { refresh_interval: "1s" } }
  });
  await client.indices.refresh({ index: "products" });

  console.log(result);
}
```

`result` includes `successful`, `failed`, `retry`, throughput. Log it.
Alert on `failed > 0`.

## Trade-offs / when this breaks

- **`refresh: true` on every write.** Kills throughput. Only use it in
  tests.
- **No alias from day one.** When you eventually need to reindex, every
  client has to change. Painful. Always start with an alias.
- **Mapping drift between v1 and v2.** A field renames here, a type
  changes there — you discover it only when search returns wrong
  results. Diff mappings before swap.
- **Reindex with active heavy writes.** Pick a low-traffic window, or
  use option B above.
- **Outbox gone wrong.** If the outbox writes happen *after* the main
  Mongo transaction commits (instead of inside it), you have the
  dual-write problem all over again. Use a single transaction.

## What to remember

- Always use the **bulk** API for >1 doc.
- Always use an **alias** in client code.
- Disable refresh + replicas during bulk loads, restore after.
- Mongo → ES sync: **outbox + event bus**, not dual-write.
- ES indexing must be **idempotent by doc id**.
- Reindex is the schema migration. Plan for it from day one.
