# 07. Sorted Sets and Ranking

Sorted sets (ZSets) are the most powerful Redis structure. They give you
ordered, indexed, range-queryable collections with `O(log N)` writes and
`O(log N + M)` range reads. This chapter covers their production uses
beyond the textbook leaderboard: time-decay scoring, autocomplete,
priority queues, and the cost characteristics that determine when ZSets
stop scaling.

---

## 7.1 The data model

A sorted set is a set of `(member, score)` pairs where `score` is a
double-precision float. Members are unique; scores are not. Internal
encoding is `listpack` for small sets, `skiplist` (plus a hashtable for
membership lookup) for larger ones — the threshold is configurable via
`zset-max-listpack-entries` and `zset-max-listpack-value`.

`O(log N)` operations:

- `ZADD`, `ZREM`, `ZSCORE`, `ZINCRBY`
- `ZRANGE BYSCORE`, `ZRANGE BYLEX`, `ZRANK`, `ZREVRANK`
- `ZRANGE` (the start point lookup)

`O(log N + M)` operations, where `M` is items returned:

- `ZRANGE` with a count, `ZRANGEBYSCORE LIMIT`

`O(N)` operations to be wary of:

- `ZRANGE 0 -1` (all members) — never run on a large set
- `ZUNIONSTORE` / `ZINTERSTORE` over large inputs
- `ZRANGEBYLEX` over a wide range

---

## 7.2 Leaderboards — the canonical case

### Plain leaderboard

```ts
// Score = points, member = userId
await client.zAdd('leaderboard:global', { score: points, value: userId });

// Top 10
const top = await client.zRange('leaderboard:global', 0, 9, { REV: true });

// Player's rank (0-indexed)
const rank = await client.zRevRank('leaderboard:global', userId);

// Player's neighbours: 5 above and 5 below
const start = Math.max(0, (rank ?? 0) - 5);
const window = await client.zRange('leaderboard:global', start, start + 10, { REV: true });
```

For a million-player leaderboard this still costs `O(log N)` per
operation. The structure scales further than most use cases require.

### Where it stops scaling

- **Hot ZSet writes** under flash-sale-style traffic concentrate on a
  single key, hence a single shard. Mitigation: shard the leaderboard
  by region / time bucket / user-id range and merge for global views
  (covered below).
- **Wide range queries** (`ZRANGE 0 -1`) on a 10M-entry leaderboard
  return 10M items in one reply and block the main thread.

### Sharded leaderboard

For very high-write leaderboards, partition by some property of the
member:

```
leaderboard:global:shard:0
leaderboard:global:shard:1
...
leaderboard:global:shard:15
```

Pick the shard from `hash(userId) % N`. To compute the global top-K,
read top-K from each shard (`O(N · log shardSize)`) and merge in
application memory. This trades read complexity for write
parallelism — appropriate when sustained writes exceed ~10k/s on a
single key.

In Cluster mode, shard suffixes also distribute the leaderboard across
slots, parallelising both reads and writes if the client pipelines.

---

## 7.3 Time-decay scoring (trending)

A "trending" ranking is just a leaderboard whose scores decay over
time. Two implementations:

### Two-key window (simple)

Keep separate ZSets for fixed buckets (e.g. one per hour). Trending =
sum across the recent N buckets.

```ts
const hour = Math.floor(Date.now() / 3_600_000);
await client.zIncrBy(`trending:product:${hour}`, 1, productId);
await client.expire(`trending:product:${hour}`, 24 * 3600);

// Top 10 trending in last 6 hours
const keys = Array.from({ length: 6 }, (_, i) => `trending:product:${hour - i}`);
await client.zUnionStore('trending:product:window', keys);
const top = await client.zRange('trending:product:window', 0, 9, { REV: true });
```

`ZUNIONSTORE` over 6 modest ZSets is fast. The merge runs on Redis;
only the final 10 entries are shipped to the application.

### Continuous decay (elegant, more expensive)

Encode the recency in the score itself:

```
score = log(views) + (timestamp / decay_window)
```

So a video posted now has its `score` carry the current epoch, and a
video from yesterday is one decay unit lower. `ZINCRBY` adjusts by
`log(views_delta)` plus a small recency adjustment.

This is the Reddit "hot" algorithm in essence. Mathematically clean but
requires care with floating-point precision over long horizons.

### Sliding window of distinct events

If "trending" should reflect distinct *users* engaging in the last hour,
not raw counts, use **HyperLogLog** per (entity, hour) and pull
cardinalities, or sliding window log per entity (Chapter 05).

---

## 7.4 Autocomplete with `ZRANGEBYLEX`

`ZRANGEBYLEX` returns members whose names fall within a lexicographic
range, in `O(log N + M)`. With all scores set to 0, a sorted set
becomes a sorted index of strings — exactly what an autocomplete needs.

```ts
const TERMS = 'autocomplete:product:terms';

// Index a product name and all its prefixes
function index(name: string, productId: string) {
  const lower = name.toLowerCase();
  const tx = client.multi();
  for (let i = 1; i <= lower.length; i++) {
    tx.zAdd(TERMS, { score: 0, value: lower.slice(0, i) + '*' });
  }
  // Mark complete terms with the productId for retrieval
  tx.zAdd(TERMS, { score: 0, value: lower + '*' + productId });
  return tx.exec();
}

// Look up suggestions for a prefix
async function suggest(prefix: string, limit = 10): Promise<string[]> {
  const start = `[${prefix.toLowerCase()}`;
  const end = `(${prefix.toLowerCase()}\xff`; // exclusive upper bound
  return client.zRange(TERMS, start, end, {
    BY: 'LEX',
    LIMIT: { offset: 0, count: limit * 5 },
  });
}
```

For real product autocomplete, this is usually the wrong tool — a
purpose-built search index (Elasticsearch, already in this platform's
stack) gives you tokenisation, scoring, and synonyms. Use ZSet-based
autocomplete only for small, latency-critical lists where running
Elasticsearch is overkill.

---

## 7.5 Priority queues with sorted sets

Encode "scheduled time" as the score; consumers pop entries whose score
is `≤ now`.

```ts
// Producer
await client.zAdd('jobs:scheduled', { score: runAtMs, value: jobId });

// Consumer (atomic: read and remove together via Lua)
const POP_DUE_LUA = `
  local items = redis.call('ZRANGEBYSCORE', KEYS[1], 0, ARGV[1], 'LIMIT', 0, ARGV[2])
  if #items == 0 then return items end
  redis.call('ZREM', KEYS[1], unpack(items))
  return items
`;
const due = await client.eval(POP_DUE_LUA, {
  keys: ['jobs:scheduled'],
  arguments: [String(Date.now()), '50'],
});
```

This gives you a delay queue with at-most-once delivery. For
at-least-once with retries on consumer failure, move popped entries to
a "running" ZSet keyed by deadline; a janitor process moves expired
items back to `jobs:scheduled`.

For anything more complex (consumer groups, backpressure, replay),
prefer Streams or RabbitMQ.

---

## 7.6 Range queries by score

Sorted sets shine at "give me X where some property is in range [A, B]":

```ts
// Products priced between $20 and $50, paginated
const page = await client.zRangeByScore('product:by_price', 20, 50, {
  LIMIT: { offset: 0, count: 50 },
});
```

Use this only when the score is naturally one-dimensional and the SoR
cannot answer the query at acceptable latency. For multi-attribute
filters, push the work to Postgres or Elasticsearch — squeezing them
into ZSets becomes ugly fast.

---

## 7.7 Pagination

Pagination of a leaderboard via offsets (`ZRANGE start end`) works
correctly only if the underlying set is stable. If scores change between
pages, page 2 may overlap or skip page 1.

For stable pagination, paginate by **score cursor**:

```ts
async function pageByScore(after: number, limit: number) {
  return client.zRangeByScore('leaderboard:global', after, '+inf', {
    LIMIT: { offset: 1, count: limit }, // skip the cursor itself
  });
}
```

Equivalent to keyset pagination in SQL. Resilient to concurrent updates
and `O(log N + M)` per page.

---

## 7.8 Costs to watch

A 10M-entry sorted set:

- Memory: roughly 80–120 bytes per entry depending on member length —
  ~1 GB. Plan for that on the host.
- `ZADD` / `ZREM` / `ZSCORE`: still `O(log N)`, sub-millisecond on a
  modern CPU.
- `ZRANGE 0 -1`: returns 10M items in one reply, blocks for seconds,
  saturates the network link. Never do this.
- `ZUNIONSTORE` of two 10M sets: `O(N)` and writes a 10M+-entry result
  set. Plan accordingly.

A safe default is to bound any range query at the application layer:
`ZRANGE start (start + 1000)`, never unbounded.

---

## 7.9 Member design

Members must be unique within the set. Consequences:

- For leaderboards keyed by user, `userId` is the member.
- For trending products with daily resets, `productId` per day is the
  member; switch keys daily.
- If you need to associate metadata (display name, avatar URL) with a
  ranked member, store it in a separate hash and look it up on
  retrieval — do not pack it into the member string.

For ties (same score), members are returned in **lexicographic** order.
If lex order is not what you want for ties (e.g. you want
"earliest insertion wins"), encode that into the score: use
`score = points * 1e9 + (1e9 - timestampSec)` so earlier timestamps win
ties — but be aware of float precision.

---

## 7.10 Concrete uses in this platform

### `product/` — trending products

Hourly buckets per category:

```
trending:product:cat:42:2026032015   ZSET   member=productId, score=views
```

Reset by TTL; the hot list is a `ZUNIONSTORE` of the last few buckets.

### `review/` — top-reviewed product list

```
top-reviewed:cat:42   ZSET   member=productId, score=avgRating * reviewCount
```

Updated by the review service on each rating; read by `product/`
through a cache.

### `order/` — scheduled retries

`jobs:scheduled` ZSet with score = `runAtMs`, members = `orderId`.
Worker pulls due items via the Lua script above. Move to `jobs:running`
on pickup; janitor recovers stuck items.

### `etl-service/` — incremental ingest cursors

A ZSet of `entityId -> lastProcessedTimestamp` lets the ETL find the
earliest uningested entity in `O(log N)`.

---

## 7.11 Observability

- ZSet cardinality (`ZCARD`) per leaderboard, sampled (not on every
  request).
- p99 latency of ranking endpoints — anomalies usually indicate a key
  has crossed the listpack→skiplist threshold or a `ZUNIONSTORE` is
  taking too long.
- Memory per ZSet via `MEMORY USAGE key` (sampled). Big ZSets quickly
  become big keys; see Chapter 08.

---

## 7.12 Continue

- [01. Redis Fundamentals](./01-redis-fundamentals.md) — encoding details and complexity.
- [08. Production Patterns](./08-production-patterns.md) — big-key mitigation and Cluster slot affinity for sharded leaderboards.
