# 11: Infrastructure exporters + Platform Overview and Datastores dashboards

**Parent spec:** `../spec.md`

**What to build:** An on-call engineer opens **Platform Overview** and, on one screen, sees:
- per-service RED across every instrumented service;
- pod health (restarts, OOMKilled, CrashLoopBackOff);
- an alert list panel;
- placeholders for SLO status and the RabbitMQ summary, filled by later tickets.

A **Datastores** dashboard shows MongoDB, Postgres and Redis connection counts, operation latency and errors.

Add kube-state-metrics, node-exporter and the MongoDB, PostgreSQL and Redis exporters to the observability group, all scraped by Alloy, with requests/limits sized for a laptop cluster. Both dashboards are provisioned as JSON with `$environment` / `$service` variables and links to Explore.

**Blocked by:** 04 (metrics pillar)

**Status:** ready-for-agent

- [ ] All exporters run in the `observability` profile with requests/limits and show as healthy scrape targets
- [ ] Platform Overview shows RED for every service instrumented so far and pod health panels
- [ ] Datastores dashboard shows live Mongo, Postgres and Redis panels
- [ ] Dashboard validation check passes for the new dashboards
