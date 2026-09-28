# 10: Go `review` service observability contract

**Parent spec:** `../spec.md`

**What to build:** `review` stops being a blind spot. It shows up on the Service Detail dashboard alongside the Node services, with the **same** metric names and log field names so every panel and query works unchanged.

It gets:
- `otelgin` tracing with W3C propagation;
- an `slog` JSON handler emitting the shared log schema with trace_id/span_id from context (Gin's default text logger removed);
- a Prometheus `/metrics` endpoint exposing the same HTTP request-duration metric with route-template labels;
- `/healthz` and `/readyz` checking Postgres and RabbitMQ;
- trace context injected into and extracted from its AMQP messages;
- k8s probes, OTel env vars and scrape annotations.

No shared Go package is created.

**Blocked by:** 04 (metrics pillar: Prometheus, Tempo and dashboards exist to receive and show it)

**Status:** ready-for-agent

- [ ] First Go test in `review` (`httptest`): one request produces a JSON log line whose trace_id matches the span captured by an in-memory recorder
- [ ] Go test: `/metrics` exposes the HTTP duration metric under the same name and labels as the Node services
- [ ] Go test: `/readyz` reports per-check status and returns 503 when a check fails
- [ ] `go test ./...` passes
- [ ] Service Detail dashboard renders `review` with no dashboard changes
