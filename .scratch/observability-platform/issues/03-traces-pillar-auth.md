# 03: Traces pillar: `auth` requests traced, with logs and traces linked

**Parent spec:** `../spec.md`

**What to build:** A developer makes a request to `auth`, reads the `x-trace-id` response header, and opens that trace in Grafana (Tempo). The trace shows the HTTP server span and the MongoDB spans. From the trace they jump to the matching logs in Loki, and from any log line they jump back to the trace.

Common gains the **telemetry bootstrap**. It's one call that takes the service name, with version and environment defaulting from env. It configures the OTel NodeSDK with:
- resource attributes (`service.name`, `service.version`, `deployment.environment`, k8s pod/namespace);
- auto-instrumentation for http/express, mongodb/mongoose, pg, ioredis/redis and amqplib;
- the OTLP exporter from env;
- a parent-based ratio sampler.

It exports nothing when `NODE_ENV=test` or no exporter endpoint is set. It accepts a test-only option to inject an in-memory span exporter (the only new test hook). The logger adds `trace_id` / `span_id` from the active context. A minimal middleware sets the `x-trace-id` response header. An incoming W3C `traceparent` is continued, not replaced. The collector being down must never break requests.

`auth` calls the bootstrap before any other import. This matters: auto-instrumentation only patches modules loaded after the SDK starts.

On the platform side:
- Tempo runs in single-binary mode;
- Alloy receives OTLP over gRPC and HTTP and forwards traces to Tempo;
- Grafana provisions the Tempo datasource with a Loki derived field (`trace_id` → Tempo) and Tempo traces-to-logs (by `service.name` + trace_id → Loki);
- `auth`'s deployment gets `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_SERVICE_NAME`, `LOG_LEVEL` and `DEPLOYMENT_ENVIRONMENT` (shared values in the k8s config).

**Blocked by:** 02 (logs pillar)

**Status:** ready-for-agent

- [ ] Common tests (throwaway Express app + in-memory exporter): a request's log line `trace_id` equals the exported server span's trace ID and the `x-trace-id` header
- [ ] Common tests: a request carrying `traceparent` produces a span in that same trace
- [ ] Common tests: with `NODE_ENV=test` and no endpoint, bootstrap makes no network calls and logging still works
- [ ] Common tests: redacted fields (password, token, authorization, `?token=` query) never appear in span attributes
- [ ] New common version published; `auth` bumped; `auth` tests pass
- [ ] `auth` keeps serving requests with the collector scaled to zero
- [ ] In Grafana, an `auth` login trace shows HTTP + MongoDB spans; log→trace and trace→logs links both work
