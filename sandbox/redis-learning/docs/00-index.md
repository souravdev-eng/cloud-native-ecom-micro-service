# Redis Production Reference — Index

This index is the entry point to the reference. Each chapter is
self-contained and cross-links the others; you do not need to read
sequentially once you are comfortable with Chapters 01–03.

## Chapters

### Part I — Foundations

- [01. Redis Fundamentals](./01-redis-fundamentals.md)
  Data model and complexity guarantees, memory layout, single-threaded
  execution model, blocking commands, and an explicit list of cases where
  Redis is the wrong tool.

- [02. Caching Patterns](./02-caching-patterns.md)
  Cache-aside, read-through, write-through, write-behind, negative caching,
  request coalescing (single-flight), and decision criteria.

- [03. Cache Invalidation](./03-cache-invalidation.md)
  TTL design and jitter, soft vs hard expiry, probabilistic early refresh
  (XFetch), event-driven invalidation, versioned keys, and the trade-off
  between staleness and load.

### Part II — Coordination

- [04. Distributed Locks](./04-distributed-locks.md)
  Why naive locks are wrong, `SET key value NX PX`, fencing tokens, the
  Redlock controversy, lock timeout selection, and when to prefer a real
  consensus system instead.

- [05. Rate Limiting](./05-rate-limiting.md)
  Fixed window, sliding window log, sliding window counter, token bucket,
  GCRA. Atomic implementations in Lua. Choosing the right algorithm for the
  workload.

- [06. Session Management](./06-session-management.md)
  When to put sessions in Redis at all, idle vs absolute timeouts, rotation
  on privilege change, revocation lists, refresh-token handling.

### Part III — Data Structures and Operations

- [07. Sorted Sets and Ranking](./07-sorted-sets-leaderboards.md)
  Score design (including time-decay), pagination of large leaderboards,
  autocomplete with `ZRANGEBYLEX`, and cost characteristics.

- [08. Production Patterns](./08-production-patterns.md)
  Persistence (RDB, AOF, hybrid), replication and failover (Sentinel,
  Cluster), key tagging and resharding, capacity planning, eviction
  policies, observability, security (TLS, ACL), and an incident runbook.

---

## Cross-cutting topics — quick lookup

| Topic | Chapter |
|-------|---------|
| Cache stampede / dogpile | 02, 03 |
| Hot keys and big keys | 08 |
| Atomicity guarantees and `MULTI` / Lua | 01, 04, 05 |
| Pub/Sub vs Streams vs Lists for queues | 01 |
| Pipelining and round-trips | 01, 08 |
| Connection pooling and lifecycle | 01, 08 |
| Eviction policies (`maxmemory-policy`) | 03, 08 |
| Persistence trade-offs (RDB / AOF) | 08 |
| Cluster slot routing and `{tags}` | 08 |
| Observability — `INFO`, slowlog, latency tools | 08 |
| Security — TLS, ACL, network isolation | 08 |

---

## Conventions used in the reference

- **Code samples** are TypeScript using `redis@4` unless otherwise noted.
- **Time** is in seconds unless suffixed (`ms`).
- **Keys** follow `service:entity:id[:subresource]` (e.g.
  `product:item:123:detail`). Cluster-affined groups use a hash tag:
  `{cart:user:42}:items`. See Chapter 08.
- **Trade-off boxes** appear at the end of each pattern. Read them. Most
  production incidents stem from picking a pattern without reading its
  trade-offs.

---

## How to contribute changes

If you encounter a production incident that this reference would have
prevented, add a short post-mortem note to the most relevant chapter. The
goal is for this document to accumulate hard-earned knowledge specific to
this platform, not to remain a static tutorial.
