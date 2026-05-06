# 02. Caching Patterns

A cache is a derivative store. Every caching decision is a trade-off
between freshness, latency, load on the system of record, and operational
complexity. This chapter catalogues the patterns, the failure modes each
introduces, and the criteria for choosing among them.

---

## 2.1 Vocabulary

| Term | Meaning |
|------|---------|
| **System of record (SoR)** | The authoritative store (Postgres in this platform). |
| **Cache hit** | The lookup found a value in cache. |
| **Cache miss** | The lookup did not find a value; the SoR was queried. |
| **Stale read** | A hit returned data older than the SoR's current value. |
| **Negative cache** | An entry recording that the SoR has no value (`null` / not-found). |
| **Stampede / dogpile** | Many concurrent misses for the same key, all hitting the SoR. |
| **Write skew** | Cache and SoR disagree because writes were applied in different orders. |

---

## 2.2 Cache-aside (lazy population)

The application owns the cache. On read, it consults the cache; on miss,
it loads from the SoR and writes the value back. On write, it updates the
SoR and **invalidates** (or updates) the cache.

```
            ┌── miss ──▶ Postgres ──▶ write to Redis ──▶ return
read ──▶ Redis
            └── hit ─────────────────────────────────▶ return
```

This is what `product/` already does on the read path. It is the
default choice for most workloads because:

- The cache is optional — if Redis is unavailable, you can degrade to a
  direct SoR read.
- Writes do not need to know about the cache layout.
- Each service can cache the projections it cares about.

### Reference implementation

```ts
// services/product/src/cache/productCache.ts
import { getRedisClient } from '../redisClient';

const TTL_SECONDS = 15 * 60;
const NEGATIVE_TTL_SECONDS = 30;
const NEG_SENTINEL = '__NULL__';

export async function getProduct(id: string): Promise<Product | null> {
  const key = `product:item:${id}:v1`;
  const client = getRedisClient();

  const cached = await client.get(key);
  if (cached === NEG_SENTINEL) return null;          // negative hit
  if (cached) return JSON.parse(cached) as Product;   // positive hit

  const row = await db.products.findById(id);
  if (!row) {
    await client.set(key, NEG_SENTINEL, { EX: NEGATIVE_TTL_SECONDS });
    return null;
  }

  await client.set(key, JSON.stringify(row), { EX: jitter(TTL_SECONDS) });
  return row;
}

function jitter(base: number, spread = 0.2): number {
  // ±spread of base — see Chapter 03 on stampede mitigation
  const delta = base * spread;
  return Math.max(1, Math.round(base + (Math.random() * 2 - 1) * delta));
}
```

Two details that the current `product` implementation in
`@/Users/sauravmajumdar/Developer/project/micro-service/cloud-native-ecom-micro-service/product/src/cache/redisCache.ts:19-27`
gets wrong and that matter in production:

1. The wrapper calls `JSON.stringify(value)` where `value` is already
   typed as `string`. This double-encodes the payload — every callsite has
   to `JSON.parse` twice or shape the value awkwardly. Either accept
   `unknown` and serialise inside, or accept `string` and serialise at the
   callsite, not both.
2. There is no jitter on TTL and no negative cache. The next two sections
   cover why both matter.

### Failure modes

- **Stampede on miss**: when a hot key expires, every concurrent request
  misses simultaneously, hits Postgres, and writes the same value back.
  Mitigation: request coalescing (§2.7) and probabilistic early refresh
  (Chapter 03).
- **Stale-after-write**: after a write to Postgres, readers may continue
  to see the cached value until invalidation propagates. Mitigation:
  invalidate (delete) the cache entry inside the same transaction
  boundary as the write, *after* the write commits.
- **Forgotten negative cache**: missing rows hit Postgres on every
  request. Mitigation: cache `null` with a short TTL using a sentinel.

---

## 2.3 Read-through

The cache itself is responsible for loading on miss. The application
calls a single `cache.get(key)` interface; if the key is absent the cache
layer fetches from the SoR, populates itself, and returns the value.

In Redis-on-its-own, "read-through" is implemented by your client wrapper
— there is no server-side loader. The pattern is identical to cache-aside
in mechanics; the only difference is encapsulation. Prefer it when:

- Multiple callers read the same projection and you want to centralise
  the loader logic, TTL choice, and metrics.
- You want a single chokepoint for request coalescing.

```ts
// One loader per projection. `loader` is invoked at most once per key
// concurrently, thanks to the in-process single-flight in §2.7.
export const productLoader = createReadThrough({
  keyPrefix: 'product:item',
  ttlSeconds: 15 * 60,
  load: (id: string) => db.products.findById(id),
});

const product = await productLoader.get(id);
```

---

## 2.4 Write-through

On every write, the application writes to **both** the cache and the SoR
synchronously. The cache always has the latest value (modulo failure
modes below).

Use when:

- Reads vastly outnumber writes and you cannot tolerate even brief
  staleness on the read path.
- The cached projection is identical to the SoR row, so the cache write
  is a straight serialisation.

Avoid when:

- The cache key holds a derived projection that is expensive to recompute
  on the write path (you will re-derive on every write, even when no one
  reads it).
- Writes are bursty; you double the write latency on the request path.

### Failure modes

- **Partial failure**: Postgres commits, Redis write fails. The cache is
  now stale and will remain so until TTL expiry. Mitigation: order writes
  SoR-first, treat the Redis failure as non-fatal, and rely on TTL +
  out-of-band invalidation (§2.6) as backstop.
- **Concurrent writers, different orders**: two writers `W1` and `W2`
  apply to Postgres in order `W1, W2` but to Redis in order `W2, W1`.
  The cache ends up with `W1`'s value while the SoR has `W2`'s — write
  skew. Mitigation: use **delete-on-write** (§2.6) instead of
  set-on-write, or include a monotonically increasing version in the
  cache and reject lower versions.

---

## 2.5 Write-behind (write-back)

The application writes only to the cache; a background process flushes
batches to the SoR asynchronously.

This pattern is sometimes proposed for high-write workloads. **Do not use
it for anything that must not be lost.** Redis is not a durable write
buffer; a primary failure between the cache write and the flush loses
data unconditionally.

Acceptable uses (rare):

- Aggregated counters where exact values do not matter (page-view
  totals, approximate analytics) — and even then, prefer a real
  streaming pipeline.
- Coalescing many small writes into a periodic flush where the SoR is the
  bottleneck and approximate persistence is acceptable.

If you find yourself wanting write-behind, the right answer is almost
always either (a) a queue/stream + a worker, or (b) increasing SoR
throughput.

---

## 2.6 Invalidation on write — delete vs update

When the SoR changes, you can either (a) `SET` the new value into the
cache, or (b) `DEL` the cache entry and let the next reader repopulate.

**Prefer `DEL`.** Reasoning:

- `DEL` is idempotent and order-insensitive: two concurrent invalidations
  produce the same result regardless of order, eliminating the write
  skew described in §2.4.
- It avoids caching values that no one reads (writers re-write a hot
  projection on every update, even at 3 a.m. when no one is reading).
- It keeps the writer ignorant of the cache projection format.

The standard sequence on a write path:

```ts
await db.transaction(async (tx) => {
  await tx.products.update(id, patch);
});
// After commit. If this fails, TTL is the backstop.
await client.del(`product:item:${id}:v1`).catch((err) => {
  log.warn({ err, id }, 'cache invalidation failed; relying on TTL');
});
```

Two subtleties:

1. **Order matters**: invalidate *after* the SoR commits, not before.
   Otherwise a concurrent reader can repopulate the cache with the
   pre-write value during the window between `DEL` and commit.
2. **Multi-key invalidations**: when one write affects multiple cached
   projections (e.g. a product change invalidates `product:item:123` and
   `product:list:category:42`), publish an invalidation event and let
   each subscriber decide what to delete (§2.8).

---

## 2.7 Request coalescing (single-flight)

When a hot key misses, hundreds of concurrent requests may hit the SoR
within microseconds. **Single-flight** ensures only one of them performs
the load while the others wait on the result.

In-process, per pod (cheap, sufficient most of the time):

```ts
const inflight = new Map<string, Promise<Product | null>>();

export async function getProduct(id: string): Promise<Product | null> {
  const key = `product:item:${id}:v1`;
  const cached = await client.get(key);
  if (cached === NEG_SENTINEL) return null;
  if (cached) return JSON.parse(cached);

  // Coalesce concurrent misses on the same key inside this process
  let pending = inflight.get(key);
  if (!pending) {
    pending = (async () => {
      try {
        const row = await db.products.findById(id);
        const payload = row ? JSON.stringify(row) : NEG_SENTINEL;
        const ttl = row ? jitter(15 * 60) : NEGATIVE_TTL_SECONDS;
        await client.set(key, payload, { EX: ttl });
        return row;
      } finally {
        inflight.delete(key);
      }
    })();
    inflight.set(key, pending);
  }
  return pending;
}
```

Cross-pod coalescing (when even one DB load per pod is too many) requires
a Redis-side mutex on the load path — a `SET NX PX` lock around the
miss-and-load — see Chapter 04. Use it only when you have measured
that in-process coalescing is not enough; the Redis lock adds a
round-trip to every miss.

---

## 2.8 Event-driven invalidation across services

When multiple services cache the same upstream entity (e.g. several
services cache product summaries), invalidation must fan out. Two
mechanisms are appropriate here:

- **RabbitMQ topic exchange** with a `cache.invalidate.<entity>` routing
  key. Reliable delivery, durable queues, retries on consumer failure.
  This is the platform's existing primitive — see
  `@/Users/sauravmajumdar/Developer/project/micro-service/cloud-native-ecom-micro-service/sandbox/rabbitmq-learning`.
- **Redis Pub/Sub** for low-latency, best-effort invalidations within a
  single cluster. Acceptable when TTL provides a backstop and the cost
  of a missed message is bounded staleness.

Do not implement bespoke HTTP fan-outs from writers to readers; that
re-invents broker mechanics badly.

---

## 2.9 Negative caching

Cache the *absence* of a value too. Without this, every request for a
non-existent ID hits Postgres — a common DoS vector when an attacker
enumerates IDs, or simply when a 404-heavy client misbehaves.

Implementation choices:

- **Sentinel value** (`__NULL__`, `__MISS__`) with a short TTL (10–60 s).
  Simple, works with any string-based cache.
- **Bloom filter** in front of the cache for huge keyspaces where even
  the negative cache memory is a concern. Adds complexity; rarely
  warranted.

Always use a **shorter TTL** for negative entries than for positive ones,
because negatives can become wrong as soon as the row is created.

---

## 2.10 Cache key design

Key conventions to adopt across services:

- **Format**: `{service}:{entity}:{id}[:{view}]:{version}`. Example:
  `product:item:123:detail:v3`.
- **Versioning**: include a schema version in the key. Bumping `v3` to
  `v4` invalidates the entire keyspace for that projection without
  requiring `SCAN` + `DEL` — old keys age out via TTL.
- **No spaces or unbounded user input**: hash or whitelist user-supplied
  components.
- **Cluster affinity** (Chapter 08): when multiple keys must share a
  slot, place the shared part inside `{}`. For example
  `{cart:user:42}:items` and `{cart:user:42}:meta` colocate on one
  shard.

Avoid:

- Storing PII or secrets in keys (they appear in slowlogs and metrics).
- Keys longer than ~200 bytes; they bloat memory and slow comparisons.
- Including timestamps that change on every read.

---

## 2.11 Choosing a pattern

| Constraint | Pattern |
|------------|---------|
| Read-heavy, tolerable staleness, simple projection | Cache-aside with TTL |
| Read-heavy, must reflect writes immediately, single writer | Write-through with `KEEPTTL` |
| Read-heavy, multi-writer | Cache-aside + delete-on-write |
| Hot-key risk on miss | Add request coalescing + jittered TTL + early refresh |
| Cross-service invalidation | Cache-aside + RabbitMQ invalidation events |
| Many 404s for non-existent IDs | Add negative caching with short TTL |
| Aggregated counter, lossy acceptable | Increment in Redis, periodic flush (only if you fully accept loss) |

When in doubt, **cache-aside + TTL + delete-on-write + jitter + coalescing
+ negative caching** is the workhorse. Start there and only add
complexity when measurement justifies it.

---

## 2.12 Observability

For each cached projection, export:

- `cache_requests_total{key_prefix, outcome="hit|miss|negative"}`
- `cache_load_seconds{key_prefix}` — histogram of SoR-loader latency
- `cache_set_errors_total{key_prefix}` — non-fatal set failures
- `cache_invalidate_total{key_prefix, source="write|event|ttl"}`

Hit rate alone is misleading. Track **hit rate, miss latency, and load
errors** together. A healthy cache may have a 70% hit rate; the failing
mode is when miss latency rises because the SoR is overloaded — that is
visible only by watching `cache_load_seconds`.

---

## 2.13 Continue

- [03. Cache Invalidation](./03-cache-invalidation.md) — TTL design, jitter, early refresh.
- [04. Distributed Locks](./04-distributed-locks.md) — cross-pod single-flight.
- [08. Production Patterns](./08-production-patterns.md) — eviction policies that interact with these patterns.
