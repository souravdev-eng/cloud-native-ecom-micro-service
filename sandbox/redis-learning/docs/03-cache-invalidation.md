# 03. Cache Invalidation

> "There are only two hard things in Computer Science: cache invalidation
> and naming things." — Phil Karlton

Invalidation determines how a derivative store becomes consistent with
its source. The job has three sub-problems:

1. Choose how long entries are allowed to be stale (**TTL design**).
2. Avoid synchronised expirations that overload the SoR
   (**stampede mitigation**).
3. React to writes that should make an entry obsolete sooner than its TTL
   would (**event-driven invalidation**).

This chapter is the operational counterpart to Chapter 02.

---

## 3.1 TTL is the foundation

Every cache entry must have a TTL. There are two reasons:

- **Memory bound**: without TTL the keyspace grows monotonically and the
  cache must rely entirely on `maxmemory-policy` eviction (Chapter 08).
  Eviction under pressure is unpredictable; explicit TTLs are not.
- **Self-healing**: TTL is the backstop for every other invalidation
  mechanism. Pub/Sub messages can be lost, RabbitMQ consumers can lag,
  delete-on-write can fail. TTL ensures eventual convergence regardless.

### Picking a TTL

Three inputs determine the TTL for a projection:

1. **Tolerable staleness** — how wrong can this entry be before a user
   notices or a downstream system breaks?
2. **Write rate** — how often does the SoR change? A TTL longer than the
   inter-write interval is mostly wasted.
3. **Load amplification** — what is the cost of the SoR query? A 100 ms
   query running 1,000× per second on miss is very different from a
   1 ms query.

Defaults that survive contact with reality:

| Projection class | TTL | Notes |
|------------------|-----|-------|
| Hot read-only catalog data (product detail, category trees) | 5–15 min | With early refresh, can extend to 1 h |
| Search results / listings | 30 s – 5 min | Short — query results change with inventory |
| User-specific views (cart, profile) | 1–10 min | Often event-invalidated; TTL is a backstop |
| Authorisation decisions | 30 s – 5 min | Bias toward shorter; security trumps load |
| Negative cache (404s) | 10–60 s | Shorter than positives — entities can appear |
| Rate-limit counters | window length | Match exactly; see Chapter 05 |
| Distributed locks | seconds | Tight bound; see Chapter 04 |

**Always add jitter** (§3.2). The values above are means, not constants.

---

## 3.2 Jitter — defeating synchronised expiry

If 10,000 cache entries are populated in a one-second burst and given a
TTL of exactly 600 s, they expire in a one-second burst 600 s later. Every
miss happens simultaneously. This is the classic **expiration stampede**.

Jitter randomises the actual TTL within a band of the nominal value:

```ts
function jitter(baseSeconds: number, spread = 0.2): number {
  const delta = baseSeconds * spread;
  // Uniform in [base - delta, base + delta]
  return Math.max(1, Math.round(baseSeconds + (Math.random() * 2 - 1) * delta));
}

await client.set(key, payload, { EX: jitter(900, 0.2) }); // 12–18 min
```

Pick `spread` so that the expected number of simultaneous expirations is
within the SoR's burst capacity. 10–25% is a good default; widen it for
extremely hot keysets.

This mitigates expiration stampede but **not** miss stampede when a
single hot key first becomes popular — for that, use coalescing (Chapter
02 §2.7) or early refresh (§3.4).

---

## 3.3 Soft TTL vs hard TTL

A **hard TTL** is the Redis `EX` value: when it elapses, the key is gone.
A **soft TTL** is an in-payload timestamp the application checks
*before* the hard TTL. When the soft TTL has passed but the hard TTL has
not, the application:

- Returns the (still cached) value to the caller — no latency penalty.
- Triggers a background refresh, ideally protected by a per-key lock.

```ts
type Wrapped<T> = { value: T; refreshAt: number; storedAt: number };

async function getWithSoftTTL<T>(
  key: string,
  loader: () => Promise<T>,
  softSeconds: number,
  hardSeconds: number,
): Promise<T> {
  const raw = await client.get(key);
  if (raw) {
    const w = JSON.parse(raw) as Wrapped<T>;
    if (Date.now() >= w.refreshAt) {
      // Stale-while-revalidate: refresh in background, do not await
      void backgroundRefresh(key, loader, softSeconds, hardSeconds);
    }
    return w.value;
  }
  return loadAndStore(key, loader, softSeconds, hardSeconds);
}
```

`backgroundRefresh` should be guarded by a per-key lock (`SET NX PX`) so
that only one process refreshes per soft-expiry window across the fleet.

This pattern eliminates the latency cost of miss-on-expiry entirely for
hot keys, at the cost of bounded staleness equal to `hard - soft`. It is
the right default for read-mostly catalog data.

---

## 3.4 Probabilistic early refresh (XFetch)

A more elegant alternative to soft TTL is probabilistic early
expiration, due to Vattani, Chierichetti, and Lowenstein (the "XFetch"
algorithm). Each reader independently decides — based on a random
draw, the time to expiry, and the recompute cost — whether to refresh
early. The mathematical effect is a smooth, distributed refresh rather
than a cliff at expiry.

Sketch:

```ts
function shouldRefresh(deltaSeconds: number, ttlRemaining: number, beta = 1): boolean {
  // delta = recent recompute cost in seconds
  // High delta or low ttlRemaining make refresh more likely
  return -deltaSeconds * beta * Math.log(Math.random()) >= ttlRemaining;
}
```

When `shouldRefresh` returns true, recompute and write back; otherwise
return the cached value. With `beta=1`, the expected refresh time is
approximately `ttlRemaining = delta`, which is exactly when the cost of
serving stale data equals the cost of refreshing.

Use this for high-read, expensive-to-compute entries where you want to
avoid both stampedes *and* the staleness window of soft TTL.

---

## 3.5 Event-driven invalidation

TTL alone is acceptable when staleness is bounded and tolerable. When a
write must propagate within seconds (e.g. price changes, permission
revocations), pair TTL with an explicit invalidation signal.

Three transport choices, in order of preference for cross-service work:

### RabbitMQ (preferred for cross-service)

The platform already runs RabbitMQ. Use a topic exchange with routing
keys like `cache.invalidate.product.item` and durable consumer queues:

```ts
// Publisher (in writer service, after SoR commit)
await channel.publish(
  'cache.invalidate',
  'cache.invalidate.product.item',
  Buffer.from(JSON.stringify({ id, version, occurredAt: Date.now() })),
  { persistent: true },
);

// Consumer (in each service that caches the projection)
channel.consume('cache.invalidate.product.item.consumer', async (msg) => {
  if (!msg) return;
  const { id } = JSON.parse(msg.content.toString());
  await Promise.allSettled([
    client.del(`product:item:${id}:v1`),
    client.del(`product:list:by-category:*`), // pattern delete — see §3.7
  ]);
  channel.ack(msg);
});
```

Properties:

- Durable, with retry and dead-lettering.
- Decouples publisher from subscriber set.
- Adds a few ms of latency vs Pub/Sub.

### Redis Pub/Sub (in-cluster, best-effort)

Lower latency but no durability. A subscriber that is down or
reconnecting misses the message:

```ts
await pub.publish('invalidate:product:item', id);

await sub.subscribe('invalidate:product:item', async (id) => {
  await client.del(`product:item:${id}:v1`);
});
```

Acceptable when TTL is short enough that a missed message means at most
a few seconds of staleness.

### Server-assisted client-side caching (Redis 6+)

`CLIENT TRACKING` lets Redis notify clients when keys they have read are
modified. Powerful but requires a separate connection (`RESP3`) for
notifications and careful lifecycle management. Reach for it when the
cache lives in-process (an LRU in Node) and you need invalidation from
Redis-as-source-of-truth.

---

## 3.6 Versioned keys (invalidate by rotation)

Sometimes you do not want to delete; you want to *retire* an entire
generation of cache entries — for example, when the projection schema
changes, or when a bulk SoR migration runs.

Encode a version in the key:

```
product:item:123:v1
product:item:123:v2   ← write here, read here, after migration
```

To roll forward, change the version constant in the application; old
keys age out via TTL with no `SCAN`/`DEL` work. This is the cleanest way
to invalidate "everything of kind X" without a maintenance window.

Pair with a single Redis-stored **generation counter** when versions
must be coordinated dynamically:

```ts
const gen = await client.get('product:item:gen'); // e.g. "v7"
const key = `product:item:${id}:${gen}`;
```

Bumping the counter (`INCR` or `SET`) effectively invalidates the entire
keyspace at once.

---

## 3.7 Pattern deletion — and why to avoid it

`DEL` only takes explicit keys. To delete by pattern (`product:item:*`)
the standard idiom is `SCAN` + `DEL`/`UNLINK`:

```ts
const it = client.scanIterator({ MATCH: 'product:item:*', COUNT: 500 });
for await (const key of it) {
  await client.unlink(key);
}
```

Two warnings:

1. **Never use `KEYS pattern`** in production. It blocks the main
   thread for the duration of the scan.
2. `SCAN` is `O(N)` overall. On a multi-million-key instance, a pattern
   delete can run for minutes, holding a connection and competing for
   CPU with normal traffic.

`UNLINK` (instead of `DEL`) hands the actual freeing to a background
thread, which mitigates main-thread blocking but does not change the
scan cost.

Prefer **versioned keys** (§3.6) for "delete everything of kind X". Use
pattern deletion only as a last resort, off-peak, with a low `COUNT` and
a sleep between batches.

---

## 3.8 Cache stampede — full mitigation stack

A "stampede" is any thundering herd at the SoR. The complete mitigation
is layered:

| Layer | Technique | Effect |
|-------|-----------|--------|
| 1 | Jittered TTL (§3.2) | Spreads expiration in time |
| 2 | In-process single-flight (§2.7) | One DB hit per pod per key per miss |
| 3 | Cross-pod lock on miss (Chapter 04) | One DB hit per cluster per key per miss |
| 4 | Soft TTL or XFetch (§3.3, §3.4) | Eliminates miss-on-expiry latency entirely |
| 5 | Negative caching (§2.9) | Prevents stampedes on non-existent IDs |

You almost never need all five. Start with 1, 2, 5; add 3 only if
measurement shows a single pod's miss handling is overwhelming the SoR;
add 4 for the hottest projections.

---

## 3.9 Eviction is not invalidation

Redis's `maxmemory-policy` (Chapter 08) decides what to evict when the
instance is at its memory limit. Eviction can remove keys before their
TTL elapses. This means:

- The application must treat any cache miss as expected, even on a
  freshly-set key.
- Choosing `allkeys-lru` vs `volatile-lru` matters: `volatile-lru` only
  evicts keys that have a TTL, so an unmarked persistent key (a
  configuration value, a session) will never be evicted under pressure.
  Use `volatile-lru` when you mix cache and non-cache data on one
  instance — but the better answer is to not mix them.
- Eviction of a session or a lock is a correctness bug; cache and
  coordination data should not share an instance whose `maxmemory` can
  be hit.

---

## 3.10 Observability for invalidation

Track explicitly:

- `cache_invalidate_total{source="write|event|ttl|eviction|version"}`
- `cache_staleness_seconds` — histogram of `now - storedAt` at read time
  (sample, do not measure every read). The p99 here is your *actual*
  staleness, not your TTL.
- `cache_stampede_protection_total{outcome="coalesced|lock_held|refreshed"}`
- For RabbitMQ-driven invalidations, the consumer queue depth and
  consumer ack rate are the key signals; lag here directly translates
  to staleness in the cache.

Alert on:

- Staleness p99 exceeding the SLO for the projection.
- Invalidation queue depth growing without bound.
- Eviction rate non-zero for instances that are supposed to be
  TTL-bound (means you are oversubscribed on memory).

---

## 3.11 Continue

- [04. Distributed Locks](./04-distributed-locks.md) — the lock primitive used in §3.3 and §3.8.
- [08. Production Patterns](./08-production-patterns.md) — eviction policies and `maxmemory` sizing.
