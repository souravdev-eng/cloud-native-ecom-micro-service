# 14: Search & Catalogue dashboard

**Parent spec:** `../spec.md`

**What to build:** A product owner opens **Search & Catalogue** and sees:
- search latency by query type and by pagination mode (offset vs cursor);
- Redis cache hit ratio by query type (search / category / filtered, matching the tiered TTLs);
- ETL freshness: time since last successful sync, records synced, sync failures, sync duration.

Business metrics:
- `product`: search requests by query type, cache hits/misses by query type, search latency by pagination mode;
- `etl-service`: sync runs by result, records synced, last-successful-sync timestamp gauge, sync duration.

The cache-key generator and both pagination modes must be unchanged.

**Blocked by:** 07 (`product` adopted), 09 (`etl-service` adopted)

**Status:** ready-for-agent

- [ ] Listed metrics exist on `product` and `etl-service` `/metrics` with low-cardinality labels only
- [ ] `product` test: a repeated identical search records one miss then one hit for its query type
- [ ] `etl-service` test: a successful sync updates the last-successful-sync gauge
- [ ] Dashboard provisioned and passes validation
