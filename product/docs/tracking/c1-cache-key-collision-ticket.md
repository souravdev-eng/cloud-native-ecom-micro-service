# C1 ticket: Give different product queries different cache keys

**Priority:** P0 — a cached response can answer the wrong query.  
**Scope:** `GET /api/product` only. Work on this before list invalidation, stampedes, or eviction.  
**Parent:** [Cache review and roadmap](cache-review-and-roadmap.md#c1--cache-keys-can-return-the-wrong-list-result-p0-confirmed)

## The problem, simply

A cache key is the label on a stored answer. If two different questions get the same label, the second person may receive the first person's answer.

Today, `ProductAPIFeature.filter()` uses `quantity`, but `generateSearchCacheKey()` leaves it out:

```text
GET /api/product?category=book&quantity[gte]=1
GET /api/product?category=book&quantity[gte]=10
```

Both can produce the same `product_search:*` key. If the first request fills Redis, the second can receive products with quantity below 10. The TTL only determines how long that wrong answer may remain; it cannot make the key correct.

Read these two short sections before editing: [key builder](../../src/utils/cacheKeys.ts) and [Mongo filter](../../src/utils/productApiFeature.ts). Notice that one chooses a few fields while the other accepts all filter fields.

## Your steps

1. **Reproduce it with a failing unit test.** Add `src/utils/__test__/cacheKeys.test.ts`. Call `generateSearchCacheKey()` with the two query objects above. Assert that their keys differ. Run that test and confirm it fails with the current code. This is the red step.
2. **Write down the invariant:** If two accepted queries can produce different response data or metadata, they must not share a cache key. The reverse is an efficiency goal: equivalent queries should ideally share a key.
3. **Fix only the key builder.** Make it serialize the _whole_ query object in a stable order, including nested filter operators. Sort object keys recursively; preserve array order because it may be meaningful. Hash the resulting string and use a new prefix such as `product_search:v2:`. Including an extra field creates an unnecessary miss, which is safer than leaving out a field that changes the result. Do not change TTLs or MongoDB filtering in this ticket.
4. **Add focused tests.** Different quantity bounds must yield different keys. The same query with top-level or nested object properties in a different order must yield the same key. Different `sort`, `fields`, `limit`, and `page` values must yield different keys. Use a search query with an extra filter too; `shouldCache()` caches it.
5. **Check the route behavior.** Warm the cache with quantity at least 1, then request quantity at least 10 and verify the second response is independently loaded. The current global Redis mock always misses and does not mock the direct `redisClient` export in `showProduct.ts`; use a small stateful fake or adjust the test mock so `get` returns values stored by `set`. Keep this route check focused on C1.
6. **Run the focused test and the product test suite** from `product/` (`npx jest src/utils/__test__/cacheKeys.test.ts --runInBand`, then `npm run test:ci -- --runInBand`). Record any unrelated failures separately.

## Done when

- The collision test fails before the fix and passes afterward.
- Different accepted queries cannot reuse each other's cached answer in the route check.
- Equivalent query objects in different property order produce the same key.
- New keys use `product_search:v2:` so existing `product_search:` entries are not read. Old entries will expire under their current TTL.

**What you learn:** cache key design, query normalization, why TTL cannot repair a key collision, and how a stateful cache test differs from a mock that always misses.
