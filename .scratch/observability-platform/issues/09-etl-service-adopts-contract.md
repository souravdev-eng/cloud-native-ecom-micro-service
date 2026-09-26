# 09: `etl-service` adopts the full observability contract

**Parent spec:** `../spec.md`

**What to build:** Each ETL sync run (cron or manual) appears as a trace with Mongo reads, Postgres/Elasticsearch writes and a root span per run. `etl-service` shows up on the Service Detail dashboard.

Its existing health routes are folded into the shared health contract: same `/healthz` / `/readyz` semantics, with checks for MongoDB, Postgres, Elasticsearch and RabbitMQ. Any extra ETL-specific status endpoint stays under its own path.

Adoption:
- bootstrap first;
- `console.log` replaced;
- middleware bundle mounted;
- k8s probes, OTel env vars and scrape annotations;
- dependency bumped.

Cron-triggered work has no incoming HTTP context, so each run starts a root span using the tracer accessor.

**Blocked by:** 06 (messaging propagation shipped in common)

**Status:** ready-for-agent

- [ ] `etl-service` depends on the latest common; existing tests (including route tests) pass or are updated to the shared health contract
- [ ] Smoke tests: `/healthz` returns 200; `/metrics` contains the HTTP duration metric
- [ ] No `console.log` left in `etl-service` source
- [ ] Manual: a manual sync produces one trace per run with datastore child spans
