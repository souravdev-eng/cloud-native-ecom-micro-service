# Spec: Production-grade observability platform (Grafana LGTM)

Status: ready-for-agent

## Problem Statement

When something goes wrong in the e-commerce platform, nobody can see what happened, where, or how bad it is.

- **Logs are scattered and unstructured.** Only `auth` uses the shared `winstonLogger`. `product`, `cart`, `order`, `notification` and `etl-service` write plain `console.log`. The Go `review` service uses Gin's default text logger. You can't filter logs by service, severity, user request or order across the fleet.
- **Nothing links logs across services.** A checkout touches the MFE, ingress, `order`, Stripe, the Stripe webhook, RabbitMQ, `cart`'s `OrderCreatedListener` and `notification`. No correlation ID or trace context crosses those hops, over HTTP or over RabbitMQ. A `webhook_pending` payment or a lost cart-clear can't be followed end to end.
- **No metrics, no dashboards, no alerts.** No service exposes request rate, error rate or latency. Nobody knows about RabbitMQ queue backlogs, Redis cache hit ratio, ETL sync lag or failed emails until a user complains.
- **Logs share infrastructure with a business feature.** The existing logger sends logs straight to the same Elasticsearch that powers `product` search (`etl-service` product→Elasticsearch sync). A burst of logs can slow or break customer search, and a search re-index can drop logs. The transport also blocks on Elasticsearch, with a 1s request timeout and retries.
- **No health contract.** Only `etl-service` has health routes. Kubernetes can't tell "alive" from "ready to serve", so rollouts and restarts are blind.

## Solution

A self-hosted observability platform built on the **Grafana LGTM stack**, deployed next to the services in Kubernetes. Every service feeds it through one shared instrumentation module in `@ecom-micro/common` (and a Go equivalent for `review`).

From the user's side:

- Open **Grafana** and land on a **Platform Overview** dashboard: every service's request rate, error rate and latency (RED), RabbitMQ health, datastore health and pod health, all on one screen.
- From any error spike, click through to the **trace** of a failing request (Tempo). The trace shows every hop: HTTP → service → Mongo/Postgres/Redis → RabbitMQ publish → consumer in another service.
- From any span, jump to the **logs** for that request (Loki), already filtered to its `trace_id`. From any log line, jump back to its trace.
- **Business dashboards** show the checkout funnel (cart → order created → payment intent → paid / failed / webhook pending), emails sent and failed, ETL sync freshness, and product search cache efficiency.
- **Alerts** built on service-level objectives (SLOs) page the on-call engineer before customers notice. Each alert links to a runbook and a pre-filtered dashboard.
- Elasticsearch goes back to one job: product search. Kibana is no longer part of the logging path.

Stack components (all open source, all in-cluster):

- **OpenTelemetry SDK** in each service. It emits traces and metrics and injects trace context into structured logs.
- **Grafana Alloy**: one collector. It receives OTLP from services, tails container stdout logs, scrapes Prometheus endpoints, applies tail sampling and redaction, and fans out to the backends.
- **Prometheus** (metrics, with exemplars) + **Alertmanager** (routing).
- **Loki** (logs).
- **Tempo** (traces, with span-metrics / service-graph generation).
- **Grafana** (dashboards, alert rules, datasource correlation), fully provisioned as code.
- Exporters: RabbitMQ built-in Prometheus plugin, MongoDB, PostgreSQL, Redis, kube-state-metrics, node-exporter.

## User Stories

### On-call engineer

1. As an on-call engineer, I want a single Platform Overview dashboard with RED metrics for every backend service, so that I can tell within seconds which service is unhealthy.
2. As an on-call engineer, I want each alert to link to a dashboard already filtered to the affected service and time window, so that I don't waste time re-building context.
3. As an on-call engineer, I want each alert to link to a runbook, so that I know the first diagnostic steps even for a service I don't own.
4. As an on-call engineer, I want alerts based on SLO error-budget burn rate rather than raw thresholds, so that I get paged for real customer impact and not for noise.
5. As an on-call engineer, I want a fast-burn alert (page) and a slow-burn alert (ticket) for each SLO, so that severity matches urgency.
6. As an on-call engineer, I want to jump from a latency spike on a graph to an example slow trace (exemplar), so that I can see the cause instead of guessing.
7. As an on-call engineer, I want to jump from a trace span to the logs emitted during that span, so that I can read the error message and stack trace in context.
8. As an on-call engineer, I want to jump from an error log line to its full distributed trace, so that I can see which upstream call triggered it.
9. As an on-call engineer, I want to see RabbitMQ queue depth, publish rate, consume rate and unacked message count per queue, so that I can spot a stuck consumer before messages pile up.
10. As an on-call engineer, I want an alert when a queue's backlog keeps growing for a sustained period, so that a crashed listener (e.g. cart's `OrderCreatedListener`) is caught quickly.
11. As an on-call engineer, I want pod restart, OOMKilled and CrashLoopBackOff signals on the overview, so that infrastructure failures are visible next to application symptoms.
12. As an on-call engineer, I want datastore health panels (Mongo, Postgres, Redis connection counts, operation latency, errors), so that I can tell whether a slowdown is the service or its database.
13. As an on-call engineer, I want an alert when a service's readiness probe keeps failing, so that I know a dependency outage is blocking traffic.
14. As an on-call engineer, I want to silence an alert for a maintenance window from Grafana, so that planned work doesn't page anyone.
15. As an on-call engineer, I want a service dependency graph built from real traces, so that I can see the blast radius of a failing service.

### Developer

16. As a developer, I want all logs to be structured JSON with a consistent schema (timestamp, level, service, version, environment, trace_id, span_id, message, error fields), so that I can query them reliably.
17. As a developer, I want to get a correctly configured logger from `@ecom-micro/common` in one line, so that I never hand-roll logging.
18. As a developer, I want trace_id and span_id added to every log line automatically, so that I don't have to pass context through my functions.
19. As a developer, I want HTTP requests, MongoDB, PostgreSQL (TypeORM/pg), Redis and outbound HTTP (e.g. Stripe) traced automatically, so that I get useful traces with no manual spans.
20. As a developer, I want trace context to travel through RabbitMQ message headers automatically via `BasePublisher` and `BaseListener`, so that a consumer's work shows up as part of the publisher's trace.
21. As a developer, I want each consumed event to produce a consumer span with exchange, routing key and outcome (acked / failed), so that I can debug event-driven flows.
22. As a developer, I want a small, documented way to add custom spans and attributes for business steps, so that I can instrument important logic without learning the whole OTel API.
23. As a developer, I want a small, documented way to record business metrics (counters, histograms), so that product-relevant numbers appear in Grafana.
24. As a developer, I want the observability stack to run in my local cluster via a skaffold profile, so that I can see my service's telemetry while developing.
25. As a developer, I want console logs to stay readable (pretty-printed) in local development and be JSON everywhere else, so that local work isn't painful.
26. As a developer, I want to change a service's log level through an environment variable without a code change, so that I can raise verbosity while investigating.
27. As a developer, I want a service to keep working if the collector is down, so that telemetry never takes production down with it.
28. As a developer, I want standard `/healthz` (liveness) and `/readyz` (readiness, with dependency checks) endpoints from common, so that every service has the same health contract.
29. As a developer, I want `/metrics` exposed on each service in Prometheus format, so that metrics can be scraped and curl-inspected directly.
30. As a developer, I want test runs to produce no telemetry network traffic, so that the existing Jest suites stay fast and hermetic.
31. As a developer on the Go `review` service, I want equivalent JSON logs, traces, metrics and health endpoints for Gin, so that `review` isn't a blind spot.
32. As a developer, I want the incoming W3C `traceparent` header respected, so that traces stay intact when a request arrives through the ingress.
33. As a developer, I want every response to carry the trace ID in a response header, so that a bug report or a browser devtools capture can be looked up directly.

### Product owner / business

34. As a product owner, I want a checkout funnel dashboard (orders created, payment intents created, payments succeeded, failed, webhook pending), so that I can see conversion and drop-off.
35. As a product owner, I want the rate of `webhook_pending` outcomes tracked as its own number, so that "card charged but order not marked paid" is visible, not hidden among failures.
36. As a product owner, I want order value and order counts over time, so that I can see business health next to technical health.
37. As a product owner, I want to see emails sent vs failed by template type in `notification`, so that I know whether customers get password-reset and order emails.
38. As a product owner, I want product search latency and Redis cache hit ratio by query type (search / category / filtered), so that I know whether search feels fast.
39. As a product owner, I want ETL sync freshness (time since last successful sync, records synced, failures), so that I know whether search results reflect current catalogue data.
40. As a product owner, I want signup, login success and login failure rates from `auth`, so that I can spot auth outages or credential-stuffing attempts.

### Platform owner / SRE

41. As a platform owner, I want all dashboards, datasources, alert rules and contact points provisioned from version-controlled files, so that Grafana can be rebuilt from scratch with no manual clicking.
42. As a platform owner, I want Elasticsearch to serve product search only, so that logging load can never slow customer search.
43. As a platform owner, I want retention limits per signal (logs, traces, metrics), so that storage stays bounded.
44. As a platform owner, I want tail-based sampling that always keeps error traces and slow traces and samples the rest, so that trace storage stays affordable without losing the interesting ones.
45. As a platform owner, I want sampling ratio and retention configurable per environment, so that dev keeps everything and prod stays within budget.
46. As a platform owner, I want metric label cardinality controlled (route templates, not raw URLs; no user IDs or order IDs as labels), so that Prometheus doesn't blow up.
47. As a platform owner, I want the telemetry pipeline to report on itself (collector dropped spans, Loki ingestion errors, Prometheus scrape failures), so that I know when observability itself is broken.
48. As a platform owner, I want resource requests and limits on every observability component, so that the stack fits on a local dev cluster and doesn't starve application pods.
49. As a platform owner, I want Grafana protected by credentials from `k8s/secret/`, so that dashboards aren't open to anyone who can reach the cluster.
50. As a platform owner, I want alert notifications routed by severity to configurable contact points (email, Slack webhook), so that routing can change without code changes.
51. As a platform owner, I want every service's telemetry to carry the resource attributes `service.name`, `service.version`, `deployment.environment` and the k8s pod/namespace, so that I can slice by deploy version during a rollout.

### Security / compliance reviewer

52. As a security reviewer, I want passwords, JWTs, session cookies, authorization headers, Stripe keys and client secrets never to appear in logs or span attributes, so that telemetry isn't a credential leak.
53. As a security reviewer, I want the password-reset `token` query parameter redacted from logged URLs and span attributes, so that captured telemetry can't be used to take over accounts.
54. As a security reviewer, I want customer email addresses masked in logs by default, so that PII exposure in the logging backend is minimised.
55. As a security reviewer, I want redaction applied twice, in the SDK and again in the collector, so that one missed code path doesn't leak secrets.

## Implementation Decisions

### Architecture

- **Grafana LGTM on self-hosted Kubernetes.** Loki (logs), Grafana (UI and alerting), Tempo (traces), Prometheus (metrics) + Alertmanager, with Grafana Alloy as the single collector. We chose it over the existing ELK path for three reasons: it moves logging off the product-search Elasticsearch, it gives native log↔trace↔metric correlation, and the sandbox (`observability-learning` modules 03–05) already validated Prometheus, Grafana and OTel for this team. It also matches the production-readiness curriculum's observability track ("structured logs w/ request-id → Prometheus `/metrics` → OTel traces propagated via RabbitMQ headers").
- **OpenTelemetry is the only instrumentation API.** Services never talk to Loki, Tempo or Prometheus directly. Traces and metrics go out via OTLP to Alloy; logs go to stdout as JSON and Alloy tails them from the node. Metrics are also exposed on `/metrics` so Prometheus can scrape them and so developers can inspect them locally.
- **Logs go to stdout, not over the network.** The `winston-elasticsearch` transport is removed. A collector outage or backpressure can then never block a request thread, and the app no longer needs Elasticsearch credentials for logging.
- **Elasticsearch and Kibana leave the observability path.** Elasticsearch stays for product search (`product` search route, `etl-service` product sync). Kibana is no longer needed for logs and can come out of the skaffold profiles once nothing else uses it.
- **This is platform infrastructure, not a new bounded context.** No new domain service, no new datastore owned by a service, no new RabbitMQ events. That keeps the curriculum's "no adding services" non-goal intact.

### The shared observability module in `@ecom-micro/common` (the single seam)

A new `observability` area in common, exported from the package root. Its public interface is deliberately small:

- **Telemetry bootstrap.** One call, made before anything else is imported in a service's entry file, takes the service name (and optionally the version and environment, defaulting from env vars). It configures the OTel NodeSDK with resource attributes, auto-instrumentation (http/express, mongodb/mongoose, pg, ioredis/redis, amqplib), the OTLP exporter endpoint from env, and the parent-based ratio sampler. When the environment is `test` or the exporter endpoint is unset, it's a no-op for export, so Jest suites stay hermetic.
- **Logger factory.** Returns a Winston logger that writes JSON to stdout with the fixed schema (timestamp, level, service, version, environment, trace_id, span_id, message, error name/message/stack, arbitrary structured fields). trace_id and span_id come from the active OTel context. Pretty console format is used when `NODE_ENV=development`. The level comes from `LOG_LEVEL`. A redaction formatter strips or masks keys on a deny-list (password, token, authorization, cookie, jwt, secret, stripe keys, card data) and masks email addresses.
- **The existing `winstonLogger(elasticSearchNode, name, level)` stays as a deprecated wrapper** that delegates to the new factory and ignores the Elasticsearch argument. That way `auth` keeps compiling, in line with the curriculum rule "extend this, don't add a second logger".
- **Express middleware bundle.** One function mounts, in order:
  - trace-ID response header (`x-trace-id`);
  - HTTP RED metrics via OTel semantic conventions (`http.server.request.duration` histogram, labelled by method, **route template**, status class);
  - a structured access log line per request with redacted URL (query params on the deny-list, including `token`, are masked);
  - the `/metrics` endpoint.
- **Health routes factory.** Accepts named dependency checks (e.g. mongo, postgres, redis, rabbitmq) and serves `/healthz` (process alive, no dependency checks) and `/readyz` (all checks pass within a timeout; response lists each check's status).
- **Instrumented messaging.** `BasePublisher` and `BaseListener` gain built-in trace propagation, so no service code changes are needed:
  - The publisher injects W3C `traceparent`/`tracestate` into AMQP message headers and creates a producer span (exchange, routing key, message size).
  - The listener extracts the context, runs `onMessage` inside a consumer span linked as a child, records the outcome (success or thrown error → span status error + error log), and records consume duration and failure counters.
  - The current `console.log` calls in both classes are replaced by the structured logger.
  - `onMessage` is awaited so errors surface in the span.
- **Business-metric and span helpers.** Thin accessors for a named meter and tracer, scoped to the service. Services own their business metric names; common only provides the tooling.
- **Versioning.** This ships as a **minor** release of `@ecom-micro/common` (2.1.0). Every Node consumer bumps its declared dependency from `^2.0.48` / `^2.0.51` to `^2.1.0`.

### Service adoption (Node: auth, product, cart, order, notification, etl-service)

Each service:
- calls the telemetry bootstrap first in its entry file;
- replaces `console.log` with the shared logger;
- mounts the middleware bundle and health routes in `app.ts`, with checks for its own datastores and RabbitMQ;
- adds k8s liveness/readiness probes pointing at `/healthz` and `/readyz`;
- adds `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_SERVICE_NAME`, `LOG_LEVEL` and `DEPLOYMENT_ENVIRONMENT` to its deployment env (shared values in `k8s/config/`);
- adds Prometheus scrape annotations/labels.

`etl-service` merges its existing health routes into the shared contract. `notification` has no inbound HTTP traffic, so it serves only `/metrics` and health.

Business metrics each service owns (names follow OTel/Prometheus conventions, low-cardinality labels only):
- `order`: orders created; payment intents created; payment outcomes by result (`succeeded`, `failed`), from the Stripe webhook; order value histogram. The client-side `webhook_pending` state can't be observed server-side, so the server-side proxy is **"orders with a payment intent that haven't become `paid` within N minutes"**, exported as a gauge.
- `cart`: cart items added/removed; carts cleared by `OrderCreatedListener`.
- `product`: search requests by query type; Redis cache hits/misses by query type (search / category / filtered, matching the tiered TTLs); search latency by pagination mode (offset / cursor).
- `auth`: signups; logins by result; password-reset requests.
- `notification`: emails sent / failed by template.
- `etl-service`: sync runs by result; records synced; last-successful-sync timestamp gauge; sync duration.

### Go `review` service

Mirrors the same contract in Go:
- `otelgin` middleware for traces;
- `slog` JSON handler with trace_id/span_id injection and the same field names;
- Prometheus client handler on `/metrics` with the same HTTP RED metric;
- `/healthz` and `/readyz` checking Postgres and RabbitMQ;
- trace-context propagation on its AMQP client.

Gin's default text logger is removed. No shared Go package is created (only one Go service exists); the contract is enforced by using identical metric and log field names.

### Collector (Grafana Alloy) pipeline

- **Receives** OTLP over gRPC and HTTP from services.
- **Logs:** tails pod stdout via the k8s API. It parses JSON, promotes `level` and `service` to Loki labels (and nothing high-cardinality), and keeps trace_id as structured metadata, not a label.
- **Redaction (second layer):** attribute and log processors drop or mask the same deny-list keys, plus a regex for bearer tokens, JWT-shaped strings and `token=` query strings.
- **Tail sampling:** keeps 100% of traces with an error status, 100% of traces slower than a latency threshold, and a configurable ratio of the rest (dev 100%, prod default 10%).
- **Scraping:** service `/metrics`, the RabbitMQ Prometheus plugin, the Mongo/Postgres/Redis exporters, kube-state-metrics and node-exporter. Results are remote-written to Prometheus with exemplars enabled.
- **Self-monitoring:** exposes the collector's own metrics (accepted/refused/dropped spans, log lines, queue sizes).

### Backends

- **Prometheus:** exemplar storage and remote-write receiver enabled; recording rules for per-service RED and SLO burn rates; retention 15 days locally.
- **Loki:** single-binary mode locally, filesystem storage on a PV; retention 7 days locally.
- **Tempo:** single-binary locally; metrics-generator enabled (span metrics + service graph, remote-written to Prometheus); retention 72 hours locally.
- **Alertmanager:** routes by `severity` label (`page` vs `ticket`) to contact points configured from `k8s/secret/`. Grafana's own alerting is used for the log-based alert rules.
- Production storage (object storage for Loki/Tempo, Mimir/Thanos for long-term metrics) is documented as the scale-out path but isn't built here.

### Grafana

- Provisioned entirely from files:
  - **Datasources:** Prometheus, Loki, Tempo, Alertmanager.
  - **Dashboards:** JSON under a dashboards folder.
  - **Alert rules and contact points.**
  - Admin credentials come from `k8s/secret/`. Anonymous access is disabled.
- **Datasource correlation:**
  - Loki derived field on `trace_id` → Tempo.
  - Tempo traces-to-logs (by `service.name` + trace_id) → Loki.
  - Tempo traces-to-metrics → Prometheus.
  - Prometheus exemplars → Tempo.
  - Tempo service graph enabled.
- **Dashboards (as code):**
  1. **Platform Overview:** per-service RED, SLO status, alert list, pod health, RabbitMQ summary.
  2. **Service Detail:** templated by `$service`; RED by route, error log panel from Loki, slowest traces from Tempo, dependency latency, runtime metrics (event loop lag, heap, GC for Node; goroutines for Go).
  3. **Event Flow:** per exchange/queue publish/consume rate, depth, unacked, consumer error rate, producer→consumer latency.
  4. **Checkout & Business KPIs:** order and payment funnel, stuck-payment gauge, order value, auth rates, email outcomes.
  5. **Search & Catalogue:** search latency by query type and pagination mode, cache hit ratio, ETL freshness.
  6. **Datastores:** Mongo, Postgres, Redis exporter panels.
  7. **Observability Pipeline Health:** collector drops, Loki ingestion errors, scrape target up/down.
- Every dashboard has `$environment` and `$service` variables and links to the matching Explore views.

### SLOs and alert rules (initial set)

- **SLOs**, each with multi-window, multi-burn-rate alerts: a fast burn pages, a slow burn raises a ticket:
  - Checkout availability: `order` non-5xx ratio on order-create and payment routes, 99.5% over 30 days.
  - Checkout latency: p95 under 1s on those routes.
  - Storefront availability: `product` non-5xx ratio, 99.5%.
  - Auth availability: `auth` login/current-user non-5xx ratio, 99.5%.
- **Symptom alerts:**
  - queue backlog growing for 10 minutes;
  - consumer error rate above threshold;
  - stuck-payment gauge above threshold;
  - ETL last-successful-sync older than 2× its cron interval;
  - email failure ratio above threshold;
  - pod CrashLoopBackOff / OOMKilled;
  - readiness failing for 5 minutes;
  - a scrape target down.
- **Log-based alert:** sustained spike in `level=error` lines per service.
- Every alert carries `service`, `severity`, `summary`, a `runbook_url` annotation and a dashboard link. Runbooks live as markdown in the repo, one per alert.

### Kubernetes and Skaffold

- **Manifests** live in a dedicated `k8s/observability/` group: Alloy (DaemonSet for log tailing plus the OTLP receiver), Prometheus, Alertmanager, Loki, Tempo, Grafana, the exporters and kube-state-metrics, and their ConfigMaps, PVs/PVCs, Services, and requests/limits sized for a laptop cluster.
- **Skaffold:**
  - A new `observability` profile deploys the stack on top of `minimal`.
  - `full` includes it and drops Kibana.
  - `minimal` stays as lean as it is today; services run fine with no collector present (story 27).
- **Access:** Grafana is reached via `kubectl port-forward` in dev, with an optional ingress host in `ingress-depl.yml` behind Grafana auth. MFE dev tooling (`dev.config.json`, `pnpm dev`) isn't changed; it only covers MFE backends.
- **RabbitMQ:** the manifest enables the `rabbitmq_prometheus` plugin.

## Testing Decisions

**What makes a good test here:** assert only on observable output (the JSON log lines written to stdout, the text served at `/metrics`, the spans handed to an exporter, the headers on a published AMQP message, the HTTP status and body of health endpoints). Never assert on which OTel classes were constructed, how processors are wired, or Winston internals. The tests must survive swapping Winston for another logger or changing SDK configuration.

**The single seam: the observability module in `@ecom-micro/common`** (confirmed with the user). Common has no test setup today, so this adds Jest + supertest to common. Tests drive the module through:
- a throwaway Express app built in the test, with the middleware bundle and health routes mounted;
- an in-memory span exporter and a manual metric reader, injected through a test-only option on the bootstrap (the only new test hook);
- captured stdout for log assertions;
- a fake AMQP channel (an in-memory object recording `publish` calls and letting the test deliver messages to a consumer callback), used with `BasePublisher`/`BaseListener` subclasses defined in the test.

Behaviours covered at this seam:
- A request produces exactly one access-log JSON line with the schema fields, and its `trace_id` equals the exported server span's trace ID and the `x-trace-id` response header.
- An incoming `traceparent` header is continued, not replaced.
- `/metrics` exposes the HTTP duration histogram labelled by **route template** (a request to `/product/123` is labelled `/product/:id`), and count/bucket values change after requests.
- Redaction: request bodies/fields named password/token/authorization, a `?token=…` query string and a bearer header never appear in log output or span attributes; emails appear masked.
- Publishing an event puts a `traceparent` header on the AMQP message. Delivering that message to a listener yields a consumer span whose parent is the producer span, in the same trace.
- A listener whose `onMessage` throws yields a consumer span with error status and an error-level log line carrying the same trace_id.
- `/healthz` returns 200 with no dependency checks. `/readyz` returns 200 when all checks pass, 503 with per-check status when one fails or times out.
- With `NODE_ENV=test` and no exporter endpoint, bootstrap makes no network calls and log output still works.
- The deprecated `winstonLogger` wrapper still returns a working logger writing the new JSON schema.

**Service level:** one smoke assertion per Node service that already has a supertest suite (`auth`, `cart`, `product`, `etl-service`): `/healthz` returns 200 and `/metrics` returns Prometheus text containing the HTTP duration metric. Prior art: the existing controller tests under `auth/src/controllers/__test__/` and each service's `src/test/setup.ts` (mongodb-memory-server / pg-mem). `order` and `notification` have no test scaffolding (per CLAUDE.md), so no tests are added there as part of this spec.

**Go `review`:** a small `httptest`-based test of its Gin middleware: one request yields a JSON log line with trace_id matching the span from an in-memory span recorder, `/metrics` exposes the same HTTP metric name, and `/readyz` reports check status. That's standard Go `testing`; `review` currently has no tests, so this is its first.

**Platform config:** a CI-runnable check validates that every provisioned dashboard JSON parses and references only provisioned datasource UIDs, and that Prometheus rule files pass `promtool check rules`. No full in-cluster end-to-end test (the user chose not to add a cluster seam).

**Manual verification (documented in the implementation PR, not automated):** run `skaffold dev -p observability`, place an order through the MFE, and confirm in Grafana that one trace spans ingress → `order` → RabbitMQ → `cart` listener → `notification`, that logs are linked both ways, and that the funnel dashboard moves.

## Out of Scope

- Browser/real-user monitoring for the MFEs (Grafana Faro, web vitals, frontend traces). The MFEs will receive `x-trace-id` in responses, but no frontend SDK is added.
- Production-scale storage and HA: Loki/Tempo on object storage, Mimir or Thanos, multi-replica backends, Grafana Cloud. Documented as the scale-out path only.
- Continuous profiling (Pyroscope).
- Synthetic probing / uptime checks from outside the cluster (blackbox exporter).
- On-call scheduling and escalation tooling (PagerDuty/Opsgenie). Alertmanager contact points are left pluggable.
- CI workflows for services that lack them (`order`, `notification`, `etl-service`, `review`).
- Adding test scaffolding to `order` or `notification`.
- Migrating `pnpm lint` to ESLint flat config or fixing the `@mfe/shared` type-check failure.
- Moving product search off Elasticsearch, or any change to search behaviour.
- New RabbitMQ events or changes to existing event payloads (trace context travels in AMQP headers, not in the payload).
- Audit logging as a compliance record (separate concern from operational logs).

## Further Notes

- **ADR.** Recorded as ADR 0001 in `doc/adr/`: *"Observability via OpenTelemetry + Grafana LGTM; Elasticsearch reserved for product search."* It also retires `winston-elasticsearch` and the Kibana logging path.
- **Curriculum alignment.** This fulfils the "Observability" cross-cutting track in `doc/tracking/production-readiness-curriculum.md` and fits its non-goals: no new domain services, and the tools (Prometheus, Grafana, OTel) are the ones the curriculum and sandbox already named.
- **Suggested implementation order** (for slicing into `issues/NN-*.md`):
  1. Common observability module + tests, publish 2.1.0.
  2. k8s observability stack + skaffold profile + Grafana provisioning with datasource correlation.
  3. Adopt in `auth` (canonical service) end to end.
  4. Roll out to `product`, `cart`, `order`, `notification`, `etl-service`.
  5. `review` Go instrumentation.
  6. Business metrics + business dashboards.
  7. SLOs, alert rules, runbooks.
  8. Remove Kibana from the logging path.
- **Bootstrap import order is load-bearing.** OTel auto-instrumentation only patches modules loaded *after* the SDK starts, so the bootstrap call must come before Express, Mongoose, TypeORM, amqplib and ioredis are imported. The per-service adoption issues should call this out.
- **`BaseListener` behaviour change.** `onMessage` becomes awaited so errors land in the consumer span. Listeners that currently rely on fire-and-forget behaviour should be checked during rollout; the prefetch of 1 means awaiting also serialises processing per consumer, which is already the effective behaviour.
- **Version drift gotcha.** Several services pin `^2.0.48`. Bumping every consumer to `^2.1.0` is part of the rollout, not optional.
- **Glossary.** No `CONTEXT-MAP.md` / `CONTEXT.md` files exist yet. Terms introduced here (SLO, error budget, burn rate, RED, exemplar, stuck payment) are platform vocabulary. If they start appearing in domain discussions, add them to `common/CONTEXT.md` via `/domain-modeling`.
