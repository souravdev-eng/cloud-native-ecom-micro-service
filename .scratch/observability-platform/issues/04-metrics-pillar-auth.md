# 04: Metrics pillar: `auth` RED metrics + Service Detail dashboard

**Parent spec:** `../spec.md`

**What to build:** A developer opens the **Service Detail** dashboard in Grafana, picks `auth` from the `$service` variable, and sees:
- request rate, error rate and latency percentiles by route;
- an error-log panel from Loki;
- the slowest recent traces from Tempo;
- Node runtime metrics (event loop lag, heap, GC).

Clicking an exemplar dot on the latency graph opens the trace behind it.

Common's **Express middleware bundle** is completed. One function mounts:
- the `x-trace-id` header;
- the `http.server.request.duration` histogram, labelled by method, **route template** (never the raw URL) and status class;
- one structured access-log line per request, with deny-listed query params such as `token` masked;
- the `/metrics` endpoint in Prometheus format.

Thin meter/tracer accessors for service-owned business metrics and custom spans are exported, with a short usage note.

On the platform side:
- Prometheus runs with exemplar storage and the remote-write receiver on, retention 15 days locally;
- Alloy scrapes service `/metrics` via annotations/labels and remote-writes with exemplars;
- Grafana provisions Prometheus with exemplar → Tempo linking and Tempo traces-to-metrics;
- the Service Detail dashboard is provisioned as JSON with `$environment` and `$service` variables.

Add a CI-runnable check that every provisioned dashboard JSON parses and references only provisioned datasource UIDs, and that Prometheus rule files pass `promtool check rules`.

**Blocked by:** 03 (traces pillar, needed for exemplars and trace panels)

**Status:** ready-for-agent

- [ ] Common tests: after requests to `/product/123`-style paths, `/metrics` shows the duration histogram labelled with the route template and counts that increase
- [ ] Common tests: exactly one access-log line per request, with `token` query values masked
- [ ] New common version published; `auth` mounts the bundle and is scraped
- [ ] `auth` gains a smoke test: `/metrics` returns Prometheus text containing the HTTP duration metric
- [ ] Service Detail dashboard renders for `auth` with RED, error logs, slow traces and runtime panels
- [ ] Clicking an exemplar opens the Tempo trace
- [ ] Dashboard/rules validation check runs locally and passes
