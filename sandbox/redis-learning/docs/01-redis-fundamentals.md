# 01. Redis Fundamentals

This chapter establishes the mental model required for the rest of the
reference: how Redis executes commands, what the data types actually cost,
and where Redis is the wrong choice.

---

## 1.1 Execution model

Redis runs commands on a **single main thread** for the keyspace. Every data
operation is serialised; there are no read/write locks visible to clients
because there is no in-process concurrency on user data.

Implications:

- A long-running command **blocks every other client**. `KEYS *`,
  `SMEMBERS` on a million-element set, `LRANGE 0 -1` on a long list,
  `HGETALL` on a wide hash, and `SUNIONSTORE` over large sets are all
  hazardous in production.
- "Atomic" in Redis means the command (or `MULTI`/`EXEC` block, or Lua
  script) runs to completion before any other client is served. This is a
  stronger guarantee than most databases provide and is what makes Redis
  suitable for primitives like counters, locks, and rate limiters.
- I/O, persistence (RDB fork, AOF rewrite), and cluster bus traffic run on
  separate threads, but command execution does not.

Since Redis 6, threaded I/O can parallelise socket reads/writes; it does
**not** parallelise command execution. Treat the command thread as the only
CPU resource that matters for latency.

---

## 1.2 The data model

Redis is a keyspace of binary-safe strings mapping to values of one of a
small set of types. Choosing the right type is almost always the highest
leverage decision you make.

| Type | Internal encodings (typical) | Use when |
|------|------------------------------|----------|
| String | `raw`, `embstr`, `int` | Single value, counter, serialised blob, bitmap |
| Hash | `listpack`, `hashtable` | Object with independently mutable fields |
| List | `listpack`, `quicklist` | FIFO/LIFO queues, recent-N feeds |
| Set | `listpack`, `intset`, `hashtable` | Membership tests, deduplication, set algebra |
| Sorted Set | `listpack`, `skiplist` | Ranking, range queries by score, leaderboards |
| Stream | `stream` (radix tree of entries) | Append-only log with consumer groups |
| Bitmap | string with bit ops | Per-user flags, presence at scale |
| HyperLogLog | string | Approximate cardinality (≈0.81% error, 12 KB) |
| Geo | sorted set under the hood | Lat/lon proximity queries |

The internal encoding switches automatically based on size thresholds
(`hash-max-listpack-entries`, `set-max-listpack-entries`, etc.). Small
collections are stored compactly inline; once they cross the threshold,
Redis promotes them to a hashtable or skiplist. This is invisible
functionally but matters for memory: keep collections small where you can.

---

## 1.3 Complexity is not optional reading

Every command in the Redis docs lists its time complexity. Internalise the
patterns:

- `O(1)` — `GET`, `SET`, `HGET`, `HSET`, `INCR`, `LPUSH`, `RPUSH`, `SADD`,
  `ZADD` (constant per-element), `EXPIRE`.
- `O(log N)` — sorted set lookups by score (`ZADD`, `ZSCORE`, `ZRANGEBYSCORE` start).
- `O(N)` — `LRANGE`, `HGETALL`, `SMEMBERS`, `SUNION`, `KEYS`, `DEL` of a
  collection (the deletion itself is `O(N)` in element count).
- `O(N+M log M)` — `SORT` and similar.

Rule of thumb: any `O(N)` command where `N` is unbounded is a latency
incident waiting to happen. Either bound `N` at the application layer
(`LRANGE 0 99`), use the iterator family (`SCAN`, `HSCAN`, `SSCAN`,
`ZSCAN`), or unlink instead of delete (`UNLINK` defers freeing to a
background thread).

---

## 1.4 Strings

Strings are the universal type. A "string" can hold up to 512 MB but you
should keep individual values well under 100 KB to avoid replication and
network pauses.

Useful operations beyond the obvious:

- `SET key value NX EX 30` — set if absent, with TTL. The atomic primitive
  for distributed locks (Chapter 04).
- `INCR`, `INCRBY`, `INCRBYFLOAT` — atomic counters. The basis for fixed
  window rate limiters (Chapter 05).
- `GETSET` (deprecated in favour of `SET ... GET`) — read-and-replace
  atomically.
- `SETRANGE` / `GETRANGE` — treat strings as byte buffers.
- `BITCOUNT`, `BITOP`, `BITFIELD` — string as bitmap. Useful for
  per-user-per-day flags at scale.

```ts
import { createClient } from 'redis';

const client = createClient({ url: process.env.REDIS_URL });
await client.connect();

// Counter — atomic, no read-modify-write race
const newCount = await client.incr('product:item:123:views');

// Conditional set with TTL — the lock primitive
const acquired = await client.set('lock:order:42', token, {
  NX: true,
  PX: 30_000,
});
if (acquired === 'OK') { /* held */ }
```

---

## 1.5 Hashes

A hash is a map from field to string within a single key. Prefer hashes
over JSON-encoded strings when:

- You mutate individual fields (`HINCRBY`, `HSET field value`).
- Most reads are for a small subset of fields (`HMGET field1 field2`).
- The object has more than two or three fields.

Avoid `HGETALL` on hashes you have not bounded in size; it returns
everything in a single response and blocks the server proportionally to
field count.

```ts
// Cart represented as a hash of productId -> quantity
const cartKey = `cart:user:${userId}`;
await client.hSet(cartKey, { 'sku:42': '2', 'sku:91': '1' });
await client.hIncrBy(cartKey, 'sku:42', 1);     // atomic increment
const qty = await client.hGet(cartKey, 'sku:42'); // O(1)
```

A hash with a few hundred small fields uses dramatically less memory than
the equivalent number of separate keys, because Redis amortises the per-key
overhead.

---

## 1.6 Lists

Lists are doubly-linked sequences of strings (encoded as `quicklist`, a
linked list of `listpack` nodes). They support push/pop at both ends in
`O(1)` and indexed access in `O(N)`.

Production uses:

- **Recent-N feeds**: `LPUSH` + `LTRIM key 0 (N-1)`. Bound the list
  explicitly; never rely on TTL alone.
- **Lightweight queues**: `RPUSH` producer, `BLPOP`/`BRPOP` consumer.
  Adequate for fire-and-forget jobs with at-most-once semantics.

Lists are **not** an adequate replacement for a real broker. They have:

- No consumer groups (use Streams).
- No native acknowledgement (a crashed consumer between `BRPOP` and
  processing loses the message).
- No replay.

For anything resembling work distribution with at-least-once delivery and
recovery, use **Streams** with `XADD` / `XREADGROUP` / `XACK`, or a
purpose-built broker (RabbitMQ is already in the platform — see
`@/Users/sauravmajumdar/Developer/project/micro-service/cloud-native-ecom-micro-service/sandbox/rabbitmq-learning`).

---

## 1.7 Sets

Unordered collections of unique strings. Operations of interest:

- `SADD` / `SREM` / `SISMEMBER` — `O(1)` membership.
- `SINTER`, `SUNION`, `SDIFF` — set algebra, `O(N)` in total elements.
  Useful for tag-based filtering, but be mindful: a single `SINTER` on
  large sets blocks the main thread.
- `SRANDMEMBER` / `SPOP` — sampling.

For very high cardinality where exactness is not required, use
**HyperLogLog** (`PFADD`, `PFCOUNT`) — constant 12 KB per key with ~0.81%
standard error.

---

## 1.8 Sorted sets

Sorted sets (ZSets) are the most expressive structure: a set of unique
members each tagged with a floating-point score. They support both
membership tests and range queries in `O(log N)`.

Primary uses:

- **Ranking and leaderboards** — Chapter 07.
- **Time-series indices** — score = unix epoch ms, retrieve via
  `ZRANGEBYSCORE`.
- **Priority queues** — score = scheduled time; consumer pops items whose
  score is `≤ now`.

```ts
// Schedule a job to run at a specific time
await client.zAdd('jobs:scheduled', { score: runAtMs, value: jobId });

// Worker pulls due jobs atomically
const due = await client.zRangeByScore('jobs:scheduled', 0, Date.now(), {
  LIMIT: { offset: 0, count: 100 },
});
```

For exactly-once dispatch, the read-and-remove must be atomic. Use a Lua
script (`ZRANGEBYSCORE` followed by `ZREM` of the same members under one
script invocation) — see Chapter 04 for the pattern.

---

## 1.9 Streams

Streams (`XADD`, `XREADGROUP`) are an append-only log with consumer groups,
acknowledgement, and pending entry lists. They are Redis's answer to
"queue with at-least-once semantics inside a single Redis instance".

Use streams when:

- You need consumer groups with parallel workers and acknowledgement.
- You want bounded retention (`XADD ... MAXLEN ~ N`).
- The volume fits on a single Redis shard (streams are not cluster-friendly
  across keys; one stream key lives on one slot).

If you already operate RabbitMQ or Kafka, prefer them for cross-service
messaging. Streams are well-suited for in-service work queues where adding
a broker dependency is unwarranted.

---

## 1.10 Pub/Sub

`PUBLISH` / `SUBSCRIBE` is fire-and-forget. There is no buffering for
disconnected subscribers. A subscriber that misses the message because it
was reconnecting, slow, or simply not yet started, will not receive it.

Use Pub/Sub only for:

- Cache invalidation broadcasts, where missing a message is tolerable
  because TTL provides a backstop.
- Operational signalling (configuration reload, leader notifications).

For anything where loss matters, use Streams or an external broker.

---

## 1.11 Pipelining and round-trips

Each command is one network round-trip by default. At 0.5 ms RTT, that
caps you at ~2,000 ops/sec per connection regardless of how fast Redis is.

**Pipelining** sends multiple commands without waiting between them and
reads the responses afterwards:

```ts
// node-redis v4 — implicit pipelining via Promise.all on a single connection
const results = await Promise.all(
  ids.map((id) => client.get(`product:item:${id}`)),
);

// Or explicit multi (no transaction semantics needed; just batching)
const multi = client.multi();
ids.forEach((id) => multi.get(`product:item:${id}`));
const results2 = await multi.exec();
```

For large fan-outs (hundreds of keys), pipelining is the difference
between 50 ms and 500 ms of total latency. `MGET` / `HMGET` /
`ZRANGEBYSCORE` are all preferable to N round-trips when applicable.

---

## 1.12 Transactions: `MULTI` / `EXEC` and `WATCH`

`MULTI`/`EXEC` queues commands and runs them atomically with respect to
other clients, but unlike SQL transactions:

- There is **no rollback**. If a command inside the block fails at runtime,
  the others still execute.
- It cannot read intermediate values to make decisions inside the block.

For optimistic concurrency, combine `WATCH` with `MULTI`/`EXEC`: if the
watched key changes between `WATCH` and `EXEC`, the transaction aborts.
This works but is awkward in TypeScript and rarely the best choice.

In practice: **use Lua scripts** (`EVAL` / `EVALSHA`) for any non-trivial
atomic operation. A script runs to completion on the server with full
read-modify-write capability and is the standard tool for rate limiters,
locks, and conditional updates.

```ts
const script = `
  local current = tonumber(redis.call('GET', KEYS[1]) or '0')
  if current >= tonumber(ARGV[1]) then return 0 end
  redis.call('INCR', KEYS[1])
  redis.call('EXPIRE', KEYS[1], ARGV[2])
  return 1
`;
const allowed = await client.eval(script, {
  keys: [`rl:${userId}`],
  arguments: [String(limit), String(windowSec)],
});
```

Cache the script with `SCRIPT LOAD` once and dispatch via `EVALSHA` to
avoid sending the body on every call.

---

## 1.13 TTL semantics

- TTLs are absolute from the time of setting, not from last access. They
  are independent of `OBJECT IDLETIME`.
- Setting a new value with `SET` **clears** the TTL unless `KEEPTTL` is
  used (`SET key value KEEPTTL`). This is a frequent source of bugs.
- `EXPIRE`, `PEXPIRE`, `EXPIREAT`, `PEXPIREAT` set TTL on existing keys.
- `TTL` returns `-2` for missing key, `-1` for no expiry, otherwise
  remaining seconds.
- Expired keys are removed lazily (on access) and via active expiration
  (a sampling scan running ~10 times per second). High write rates with
  short TTLs can leave many expired-but-not-evicted keys until pressure
  triggers eviction.

Picking TTLs is covered in Chapter 03; the short version is **always set a
TTL on cache entries and add jitter**.

---

## 1.14 When Redis is the wrong tool

Redis is excellent for: caches, counters, rate limiters, locks, ranking,
session-like state, ephemeral coordination. It is the **wrong** tool when:

- You need durability guarantees on every write. Even AOF with
  `appendfsync always` lags a real WAL-backed database, and synchronous
  replication is not the default. Use Postgres for orders, payments,
  ledgers.
- The dataset must outgrow RAM. Redis is RAM-resident; spilling to disk is
  not a first-class option.
- You need rich queries: secondary indices, joins, aggregations across
  large datasets. RediSearch exists but is a different product with its
  own operational profile.
- You need transactional consistency across multiple keys that may live
  on different cluster shards. Cluster mode requires keys in a transaction
  to share a hash tag (Chapter 08), which constrains your data model.

The current platform correctly uses Postgres for products and orders and
Redis for read-side caching. Keep that boundary.

---

## 1.15 The platform's current implementation

`@/Users/sauravmajumdar/Developer/project/micro-service/cloud-native-ecom-micro-service/product/src/redisClient.ts:1-28`
bootstraps a singleton client and exposes `getRedisClient`. It works but
omits several things production code needs:

- **No reconnect strategy** — `node-redis` v4 reconnects by default with an
  exponential backoff capped at ~500 ms; explicitly configure
  `socket.reconnectStrategy` to bound retries and surface persistent
  failure to the health check.
- **No `ready` gate** — `connect()` resolves before the client is `ready`
  in some failure modes; gate request handling on the `ready` event in
  health checks.
- **No graceful shutdown** — wire `client.quit()` into the SIGTERM handler
  so in-flight commands flush before the pod is terminated.

`@/Users/sauravmajumdar/Developer/project/micro-service/cloud-native-ecom-micro-service/product/src/cache/redisCache.ts:19-27`
calls `JSON.stringify(value)` on a `string` argument, which double-encodes
the payload (it becomes a JSON string of a JSON string). The wrapper
should either accept `unknown` and serialise once, or accept `string` and
not serialise at all. Chapter 02 shows the corrected version.

---

## 1.16 References

- Redis command reference with complexity: <https://redis.io/commands/>
- Encoding internals: <https://redis.io/docs/latest/develop/reference/optimization/memory-optimization/>
- Threaded I/O (Redis 6+): <https://redis.io/docs/latest/operate/oss_and_stack/management/config-file/#threaded-io>
- *Redis in Action*, Carlson — Chapters 3–5 cover data structures in depth.

Continue to [02. Caching Patterns](./02-caching-patterns.md).
