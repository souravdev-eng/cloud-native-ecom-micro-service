# Product service cache review and roadmap

**Reviewed:** 2026-10-07  
**Scope:** `product/src` and `k8s/product-redis-depl.yml` as checked into this repository. This is a code review, not a measurement of a running cluster.  
**Status:** Findings documented; no cache behavior changed by this document.

## What exists today

The service uses **cache aside**: read Redis, fetch from MongoDB on a miss, then store the result in Redis. MongoDB is the source of truth. The paths are not uniform:

| API or event | Redis key | TTL | On a miss or write |
| --- | --- | --- | --- |
| `GET /api/product/:id` | `product:<id>` | 15 minutes | Loads `Product.findById`; does not cache a missing product. |
| `GET /api/product` | `product_search:<md5 of selected query fields>` for queries accepted by `shouldCache` | 60 minutes when `search` is present; otherwise 10 minutes | Runs `ProductAPIFeature`; stores only nonempty result pages. Unfiltered lists normally bypass Redis. |
| `GET /api/product/search` and `/search/suggest` | None | None | Uses Elasticsearch when available and MongoDB as a fallback. |
| `GET /api/product/seller` | None | None | Queries MongoDB. |
| Product update/delete and quantity event | Deletes `product:<id>` | — | Does not invalidate cached lists. |
| Product create and seller ID update | None | — | No cache invalidation. |

Evidence: [detail route](../../src/routes/showProductDetailById.ts), [cache wrapper](../../src/cache/redisCache.ts), [list route](../../src/routes/showProduct.ts), [key builder](../../src/utils/cacheKeys.ts), [search route](../../src/routes/searchProduct.ts), [seller list](../../src/routes/showAllSellerProducts.ts), [update](../../src/routes/updateProduct.ts), [delete](../../src/routes/deleteProduct.ts), [create](../../src/routes/newProduct.ts), [seller ID update](../../src/routes/updateAllSellerId.ts), [quantity listener](../../src/queues/listeners/productQuantityUpdate.ts).

The 2026-04-22 [product service review](product-service-review.md) predates some of this code. For example, the current list route has two TTL tiers (60 and 10 minutes), not a separate five minute filtered tier. Check code when making a change.

## Concepts mapped to this service

- **Cache architecture:** Cache aside fits these Mongo-backed reads. Keep MongoDB authoritative while improving the current implementation. The other patterns are useful comparisons, not proposed replacements:

  | Pattern | Who loads or writes the database? | Fit here |
  | --- | --- | --- |
  | Cache aside | Application loads on a miss and updates MongoDB directly. | Current pattern; simple, but requires explicit invalidation and miss handling. |
  | Read through | Cache layer loads MongoDB on a miss. | Would require a cache layer that knows how to load products; does not fix an incomplete list key. |
  | Write through | Cache layer synchronously writes the durable store. | More write coordination; still needs a defined response when one write succeeds and the other fails. Redis alone does not supply this product-specific behavior. |
  | Write behind | Cache accepts writes and persists them later. | Poor fit for product price and inventory because a cache failure could lose unflushed changes. |

- **Expiration versus eviction:** TTL expires a key after a set time; Redis `maxmemory-policy` decides which keys to remove when a configured memory budget is reached. The manifest specifies neither `maxmemory` nor `maxmemory-policy`. We therefore have TTLs, but no repository-configured LRU, LFU, or FIFO policy. Redis documents `maxmemory 0` as the 64-bit default, meaning no dataset memory limit; verify the live configuration before assuming the deployment uses that default.

  | Idea | What it decides | Relevance |
  | --- | --- | --- |
  | TTL | When an entry becomes too old to serve. | Already set on detail and selected list entries; also bounds staleness if invalidation fails. |
  | LRU | Which less recently accessed key to evict at the memory ceiling. | Reasonable first candidate for a bounded Redis cache. |
  | LFU | Which less frequently accessed key to evict at the memory ceiling. | Candidate if a stable set of products dominates reads; compare using hit-rate data. |
  | FIFO | Which oldest inserted entry to evict, regardless of reads. | Useful conceptually, but not a built-in Redis `maxmemory-policy` choice here. |

- **Stampede:** Simultaneous misses on one key each issue a MongoDB query. Expiration, a delete, or cache recovery can trigger this.
- **Consistency:** Deleting a detail key after a write reduces stale reads, but does not invalidate list keys or eliminate a read/fill race.
- **Hot keys:** A popular product repeatedly hits the single Redis pod even if its hit rate is excellent. This is a risk to measure, not a production incident established by this review.

## Findings and learning exercises

### C1 — Cache keys can return the wrong list result (P0, confirmed)

**Hands-on ticket:** [C1 cache-key collision](c1-cache-key-collision-ticket.md).

`ProductAPIFeature.filter()` accepts query fields beyond the set in `generateSearchCacheKey()`. For example, `?category=book&quantity[gte]=1` and `?category=book&quantity[gte]=10` produce the same cache key despite asking different MongoDB questions. `rating`, `tags`, `sellerId`, and other accepted fields have the same class of risk. The cache decision and key construction also need to account for pagination inputs whenever the query engine uses them.

**Change:** Define supported list query parameters in one place. Validate and normalize them, then build the key from every input that can affect the response, including filter operators, sort, field projection, limit, and pagination mode. Decline caching for an unsupported or ambiguous query. Version the key format (`product_search:v2:...`) so old entries are not reused after the fix.

**Verify:** Seed products with different quantities. Request the two URLs in both orders and confirm distinct results and keys. Add equivalent cases for search plus an additional filter, sorting, projection, and pagination. Tests must exercise a working Redis substitute; the current `src/test/setup.ts` mock always returns a miss and does not expose the direct `redisClient` export used by the list route.

### C2 — List results remain stale after writes (P0, confirmed)

Create, update, delete, and inventory changes can alter list membership, sorting, projection, or values, but only detail keys are deleted. A cached search result can persist for up to 60 minutes after a write; other cached filters can persist for up to 10 minutes. `update-seller-id` skips even detail-key deletion.

**Change:** First set a freshness target for catalog lists versus inventory and price. A simple first step is a shorter, justified list TTL. For stronger freshness, use a versioned list namespace: include a catalog generation in keys and increment it after relevant writes. Old generations then expire naturally. Avoid scanning and deleting every list key on every product write until its cost and race behavior are understood. Add the missing detail invalidation on seller ID updates.

**Verify:** Warm detail and multiple list queries, then create, update, delete, decrement quantity, and change seller ID. Check which responses must reflect each change immediately and which may remain stale within the agreed window.

### C3 — Redis failures can change API and event outcomes (P1, confirmed)

Read and fill operations await Redis without a fallback. Update and delete commit to MongoDB before awaiting `cache.del()`, so a Redis error can produce an API failure after the database has changed. The quantity listener updates MongoDB before deletion and acknowledgment; a Redis error can leave the message unacknowledged after the decrement. Startup also registers that listener before connecting Redis.

**Change:** Give reads an explicit failure policy, likely bounded Redis timeouts followed by a MongoDB read while recording a cache error. Define separately how failed invalidation is retried or reconciled; merely ignoring deletion errors can leave a stale detail value until TTL. Design the quantity event path with redelivery/idempotency in mind before altering acknowledgment behavior. Connect dependencies before consuming messages.

**Verify:** Inject Redis get, set, and delete failures separately. Confirm the returned HTTP status matches whether MongoDB committed; confirm event redelivery cannot decrement inventory twice. Test startup ordering.

### C4 — A deleted key can be refilled with an old value (P1, confirmed race)

Possible order: reader misses; reader loads old product; writer saves new product and deletes the key; reader stores the old product. That old value may then live for the full detail TTL. This is a concurrency possibility in the current code, not an observed production frequency.

**Change:** If immediate freshness is required, use a per-product generation/version in the key, or validate the version before filling. The write advances the generation after MongoDB commits, so a late fill of the old generation is no longer read. Choose the failure policy for a generation update before implementation.

**Verify:** Use barriers in a concurrency test to force the order above. Check that a read after the write cannot see the old value.

### C5 — Concurrent misses can stampede MongoDB (P1, scale-dependent)

Neither read path coalesces misses. One expired hot detail key can cause many concurrent `findById` calls. Uncached missing IDs and empty list results can also cause repeated database work, though negative caching needs a short TTL and careful invalidation on creation.

**Change:** Start with per-key single flight inside one service process. It shares one pending database load among concurrent requests to that process. It does not coordinate multiple pods. If metrics show cross-pod stampedes, consider a bounded Redis lock or stale-while-revalidate, with lock expiry and a fallback for lock-holder failure. Add TTL jitter where many keys are filled together.

**Verify:** Fire parallel reads for the same cold key and count MongoDB calls; test failure of the loading request and a retry. Repeat with multiple service instances before claiming cross-pod protection.

### C6 — Cache capacity and eviction are unspecified (P1, deployment gap)

The Redis manifest runs one pod and sets no memory request/limit, `maxmemory`, or eviction policy. TTL does not prevent a burst of distinct keys from filling memory before they expire. The right policy cannot be selected from code alone.

**Change:** Measure `used_memory`, key count, key sizes, `evicted_keys`, and hit/miss counts. Set a pod memory budget and a lower Redis `maxmemory`, leaving headroom for Redis overhead. Since this Redis is intended for expendable product cache entries, compare `allkeys-lru` and `allkeys-lfu` against real access patterns. `noeviction` would reject new cache writes at the limit; `volatile-*` policies only consider keys with TTL. Record the chosen values and why. A persistent volume is mounted even though the entries are reconstructible; review whether persistence is needed before changing it.

**Verify:** Under a representative load and a small test memory ceiling, observe evictions, hit rate, memory, and API behavior when a `SET` fails.

### C7 — Hot keys and cache value are not measured (P2, unverified risk)

There are no product-specific hit/miss counters or cache error and latency metrics in these paths. A single Redis pod may become the bottleneck for a very popular key, but the repository provides no traffic evidence that this occurs.

**Change:** Add counters for hits, misses, fills, errors, and bypasses by endpoint and bounded key class (never raw query strings or product IDs as metric labels). Track Redis and MongoDB latency and the number of MongoDB loads per cache miss. Use Redis `INFO` and, where appropriate, hot-key sampling to identify skew. Only then consider an in-process cache for a very small set of hot keys; it requires its own short TTL or invalidation strategy across pods.

**Verify:** A dashboard can show hit ratio, miss bursts, error rate, Redis memory and evictions, and MongoDB load before and after each change.

### C8 — Tests do not protect cache behavior (P1, confirmed)

Existing route tests check response status and basic product content, but do not prove a second read hits Redis, that writes invalidate the right keys, that TTLs are set, or that failures and concurrent misses behave as intended. The global Redis mock always misses, so it cannot expose stale data or key collisions.

**Change:** Add a small in-memory Redis fake or a Redis-backed integration test fixture with real `GET`, `SET EX`, and `DEL` behavior. Keep focused tests at the public route and cache-boundary levels. Test one behavior per finding rather than duplicating implementation details.

## Incremental work plan

Each step is a reviewable change with a clear lesson. Complete correctness work before adding performance layers.

1. **Cache test foundation and query-key fix (C1, C8).** Build a stateful cache test fixture, reproduce the collision, normalize inputs, and version list keys. Done when query variants cannot return each other's cached result.
2. **Freshness contract and invalidation (C2).** Decide acceptable staleness for detail, price, inventory, and list/search. Apply it to every mutation path and test warm-cache writes. Done when the observed response age stays within the agreed contract.
3. **Failure policy and startup order (C3).** Define cache timeouts, read fallback, and invalidation recovery; handle the quantity listener's redelivery semantics. Done when injected Redis failures have predictable API and event outcomes.
4. **Read/write race (C4).** Reproduce the late-fill race and add a version mechanism if the freshness contract requires it. Done when a post-write read cannot use an old fill.
5. **Single flight and miss protection (C5).** Add per-process coalescing, then measure whether cross-pod coordination is needed. Done when parallel cold reads have a bounded MongoDB fan-out.
6. **Capacity, eviction, and observability (C6, C7).** Measure baseline traffic, choose a memory budget and Redis eviction policy, and alert on errors or eviction pressure. Done when configuration is explicit and its effect is visible.

### Suggested cache boundary for the first implementation step

Keep one product-cache module responsible for serialization, namespaced keys, TTL selection, get/set/delete, and metrics. Keep query normalization close to `ProductAPIFeature`, because it knows which parameters change a result. Routes should call the cache boundary rather than mixing the current `cache` wrapper with direct `redisClient` calls. The cache boundary must make Redis failure behavior explicit; it must not quietly turn a failed invalidation into a successful freshness guarantee.

## Questions to answer with measurements or product requirements

- How stale may price, availability, detail, and search/list responses be after a successful write?
- What are peak read/write rates, detail/list hit ratios, and MongoDB latency for misses?
- How many distinct list queries and key bytes appear in a 10–60 minute window?
- Is Redis used for anything other than reconstructible product data in the deployed environment?
- Are Redis restarts, OOM kills, or concentrated hot keys already visible in telemetry?

## References

- [Hello Interview: Caching](https://www.hellointerview.com/learn/system-design/core-concepts/caching) — cache aside, eviction, stampedes, consistency, and hot keys.
- [Redis: Key eviction](https://redis.io/docs/latest/develop/reference/eviction/) — `maxmemory`, default behavior, and LRU/LFU policy options.
- [Redis: Keys and values](https://redis.io/docs/latest/develop/use/keyspace/) — expiration and TTL behavior.
