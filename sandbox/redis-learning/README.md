# Redis Production Reference

A production-oriented reference for designing, operating, and reasoning about
Redis as a cache, coordination layer, and data structure server inside this
microservices platform.

This is **not** an introductory tutorial. It assumes familiarity with Redis
basics (`GET`, `SET`, `EXPIRE`) and focuses on the decisions you will face when
running Redis under real traffic: failure modes, capacity, consistency,
observability, and operational runbooks.

---

## Scope

The reference is organised into eight chapters:

| # | Chapter | Focus |
|---|---------|-------|
| 01 | [Redis Fundamentals](./docs/01-redis-fundamentals.md) | Data model, complexity, memory layout, when *not* to use Redis |
| 02 | [Caching Patterns](./docs/02-caching-patterns.md) | Cache-aside, read/write-through, write-behind, negative caching, request coalescing |
| 03 | [Cache Invalidation](./docs/03-cache-invalidation.md) | TTL design, jitter, soft vs hard expiry, event-driven, versioned keys |
| 04 | [Distributed Locks](./docs/04-distributed-locks.md) | `SET NX PX`, fencing tokens, Redlock trade-offs, lock timeouts |
| 05 | [Rate Limiting](./docs/05-rate-limiting.md) | Fixed/sliding window, token bucket, GCRA, Lua atomicity |
| 06 | [Session Management](./docs/06-session-management.md) | Session storage trade-offs, rotation, revocation, idle vs absolute timeout |
| 07 | [Sorted Sets & Ranking](./docs/07-sorted-sets-leaderboards.md) | Leaderboards, time-decay scoring, autocomplete, range queries |
| 08 | [Production Patterns](./docs/08-production-patterns.md) | Persistence, replication, Sentinel, Cluster, observability, capacity, security |

---

## How this reference is used here

Redis is currently used inside the `product` service for read-side caching.
The relevant code lives in:

- `@/Users/sauravmajumdar/Developer/project/micro-service/cloud-native-ecom-micro-service/product/src/redisClient.ts:1-28` — connection bootstrap (`node-redis` v4)
- `@/Users/sauravmajumdar/Developer/project/micro-service/cloud-native-ecom-micro-service/product/src/cache/redisCache.ts:1-49` — thin `get`/`set`/`del` wrapper

Several chapters call out gaps in that implementation (no retry/reconnect
strategy, double JSON encoding in `set`, no jittered TTL, no negative caching,
no metrics) and show production-ready replacements.

Other services that *should* adopt Redis patterns documented here:

| Service | Pattern | Chapter |
|---------|---------|---------|
| `auth` | Refresh-token store, session revocation, login throttling | 05, 06 |
| `cart` | Hash-based cart state, idempotency keys | 01, 02 |
| `order` | Inventory reservation locks, idempotent checkout | 04 |
| `product` | Read-through cache, trending products, autocomplete | 02, 03, 07 |
| `notification` | Deduplication windows, delivery rate caps | 03, 05 |
| `review` | Sliding window write throttle | 05 |

---

## Stack assumptions

- **Client**: `redis` (node-redis) `^4.6` — same version used by `product/`.
  Examples are written against this client. Where behaviour differs in
  `ioredis`, it is called out explicitly.
- **Language**: TypeScript, ES2022 target.
- **Topology**: Single primary in development; primary + replica with Sentinel
  or Redis Cluster in production. Chapter 08 covers the migration path.
- **Deployment**: Kubernetes; manifests live under
  `@/Users/sauravmajumdar/Developer/project/micro-service/cloud-native-ecom-micro-service/k8s`.

---

## Examples

Runnable TypeScript examples accompany each chapter under `examples/`. They
are intentionally minimal and **not** production-ready on their own — the
chapters explain what would need to be added (retries, metrics, structured
logging, graceful shutdown).

```bash
# From sandbox/redis-learning
docker compose -f ../../tools/docker-compose.yml up -d redis
cd examples
npm install
npm run cache-aside
```

---

## Reading order

If you are new to the platform, read in order. If you are looking up a
specific decision:

- **Choosing a cache pattern** — Chapter 02
- **Avoiding cache stampede** — Chapter 02 (request coalescing) + Chapter 03 (jitter, early refresh)
- **Implementing a lock correctly** — Chapter 04 (read the failure-modes section before writing code)
- **Sizing a Redis instance** — Chapter 08 (capacity & memory)
- **Picking persistence settings** — Chapter 08 (RDB/AOF trade-offs)

---

## External references

The chapters cite primary sources where relevant. The following are worth
reading in full at least once:

- Redis documentation: <https://redis.io/docs/latest/>
- *Redis in Action* — Josiah Carlson (still the best applied book)
- Antirez, "Is Redlock safe?" thread and Martin Kleppmann's response — required
  reading before implementing distributed locks (Chapter 04)
- Redis command reference with complexity annotations: <https://redis.io/commands/>
