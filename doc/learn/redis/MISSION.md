# Mission: Redis for distributed systems

## Why
Redis is in the platform (the `product` cache) and is the obvious tool for locks, rate limits and shared state across pods. I want to reason about it as a distributed component, not just call `GET`/`SET`.

## Success looks like
- I can explain what happens when N pods do read-modify-write on one key, and fix it with an atomic command or Lua.
- I can find and explain the stale-search-cache bug in `product`, and design the fix.
- I can choose a TTL, jitter and stampede protection for a cache and defend the choice.
- I can say what `product` does when Redis is down or slow, and whether that's correct.
- I can say when a Redis lock is safe, when it isn't, and what to use instead (an atomic Mongo update, an idempotency key).
- I can explain why an acknowledged write can disappear after failover.
- I can explain hash slots and hash tags, and read a `CROSSSLOT` error.
- I can review a Redis-related PR and catch the common mistakes.

## Constraints
- About 25–30 minutes per lesson.
- Three study days: Lessons 0–3, 4–6, 7–9.
- Every concept is shown in a lab. Labs live in `sandbox/redis-learning/` and need one command.

## Out of scope
- Fixing the stale-search-cache bug or other gaps in `product` (`redisClient.ts` reconnect/timeout, the `get()` type mismatch). The course designs the fixes; applying them is a separate ticket.
- Changing `k8s/product-redis-depl.yml` (pinning the image, Sentinel, StatefulSet). Discussed in Lesson 7 and the operations sheet only.
- Adding Redis to any other service (`auth` login throttle, `order` idempotency). Lesson 6 has a design exercise only.
- Sessions, CSRF, refresh-token stores, Redis Streams as a queue, RediSearch, Redis Stack modules, ACL/TLS hardening, managed Redis (ElastiCache, Redis Cloud). These are further reading in `RESOURCES.md`.
- Running Redis at production scale, or benchmarking.
