# 07: `product` adopts the full observability contract

**Parent spec:** `../spec.md`

**What to build:** `product` appears on the Service Detail dashboard with RED metrics, logs and traces. A storefront search shows up in Tempo with its Redis cache lookup and its MongoDB or Elasticsearch query as child spans. Product events it publishes carry trace context to consumers.

Adoption:
- bootstrap first in the entry file;
- `console.log` replaced by the shared logger;
- middleware bundle mounted;
- health routes checking MongoDB, Redis, Elasticsearch and RabbitMQ;
- k8s probes, OTel env vars and scrape annotations;
- dependency bumped to the latest common.

Search behaviour, both pagination modes and the cache-key generator must stay unchanged.

**Blocked by:** 06 (messaging propagation shipped in common)

**Status:** ready-for-agent

- [ ] `product` depends on the latest common; existing `product` tests pass
- [ ] Smoke tests: `/healthz` returns 200; `/metrics` contains the HTTP duration metric
- [ ] No `console.log` left in `product` source
- [ ] Route labels on metrics are templates (e.g. `/api/v1/product/:id`), not raw IDs
- [ ] Manual: a search request shows HTTP, Redis and datastore spans in one trace
