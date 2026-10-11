# Redis resources

## Knowledge

- [Redis: Transactions](https://redis.io/docs/latest/develop/using-commands/transactions/)
  `MULTI`/`EXEC`/`WATCH`, with the "two clients read 10, both write 11" race spelled out. Use for: Lesson 0's lost update, and why `MULTI` alone can't read-then-decide.
- [Redis: Diagnosing latency, "Single threaded nature of Redis"](https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/latency/)
  "Redis can serve a single request in every given moment." Use for: why one command is atomic, and why one slow command stalls every client.
- [Redis: Pipelining](https://redis.io/docs/latest/develop/using-commands/pipelining/)
  Round-trip time (RTT) and how pipelining cuts it. Use for: "one round trip per command". Pipelining is not atomic.
- [Redis: INCR](https://redis.io/docs/latest/commands/incr/)
  O(1) atomic increment, plus the counter and rate-limiter patterns. Use for: Lesson 0's fix; Lesson 6 revisits the rate limiter.
- [Redis: KEYS](https://redis.io/docs/latest/commands/keys/) and [SCAN](https://redis.io/docs/latest/commands/scan/)
  Why `KEYS` is for debugging only, and how `SCAN` walks the keyspace in small batches. Use for: the "unbounded O(N) is an incident" rule.
- [Redis: UNLINK](https://redis.io/docs/latest/commands/unlink/)
  Deletes keys and frees their memory in a background thread. Use for: lab cleanup and big-key deletes.
- [Redis: Data types](https://redis.io/docs/latest/develop/data-types/)
  The full catalogue. The course only uses strings, hashes and sorted sets; see reference sheet 01.
- [Redis: Programmability, Lua scripting](https://redis.io/docs/latest/develop/programmability/eval-intro/)
  Scripts run atomically on the server. Use for: Lessons 5–6.
- [Redis: Replication](https://redis.io/docs/latest/operate/oss_and_stack/management/replication/), [Sentinel](https://redis.io/docs/latest/operate/oss_and_stack/management/sentinel/), [Persistence](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/)
  Asynchronous replication, failover, RDB/AOF. Use for: Lesson 7.
- [Redis: Scaling with Cluster](https://redis.io/docs/latest/operate/oss_and_stack/management/scaling/) and the [Cluster spec](https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/)
  Hash slots, hash tags, `MOVED`/`ASK`. Use for: Lesson 8.
- [Redis: Key eviction](https://redis.io/docs/latest/develop/reference/eviction/)
  `maxmemory` policies. Use for: the operations sheet.
- [Martin Kleppmann: How to do distributed locking](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html) and [antirez: Is Redlock safe?](https://antirez.com/news/101)
  The two sides of the Redlock debate, and where fencing tokens come from. Use for: Lesson 5.
- [Designing Data-Intensive Applications](https://dataintensive.net/), chapter 7 ("Preventing lost updates") and chapters 8–9
  The general theory behind Lessons 0, 5 and 7.

## Further reading (cut from the course)

These were in the old `sandbox/redis-learning/docs/` chapters. They're useful, but not needed to meet the mission.

- Caching extras: soft TTL and XFetch, [Optimal Probabilistic Cache Stampede Prevention (Vattani et al., VLDB 2015)](https://www.vldb.org/pvldb/vol8/p886-vattani.pdf); [client-side caching with `CLIENT TRACKING`](https://redis.io/docs/latest/develop/reference/client-side-caching/).
- Rate limiting extras: GCRA and sliding log, [Brandur: Rate limiting, GCRA](https://brandur.org/rate-limiting).
- Locks: [Redis: Distributed locks with Redis (Redlock)](https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/).
- Other data types: [Streams](https://redis.io/docs/latest/develop/data-types/streams/) (and Streams vs RabbitMQ), [bitmaps](https://redis.io/docs/latest/develop/data-types/bitmaps/), [HyperLogLog](https://redis.io/docs/latest/develop/data-types/probabilistic/hyperloglogs/), [geospatial](https://redis.io/docs/latest/develop/data-types/geospatial/).
- Sessions, CSRF tokens and refresh-token stores.
- Security: [ACLs](https://redis.io/docs/latest/operate/oss_and_stack/management/security/acl/) and TLS.

## Tools

- `npm run redis:cli` (from `sandbox/redis-learning/`) opens `redis-cli` inside the lab Redis. `MONITOR` there prints every command the server runs, live.
- [node-redis](https://github.com/redis/node-redis): the client used by `product/` and the labs (v4).
