---
status: accepted
date: 2026-09-26
---

# Observability via OpenTelemetry + Grafana LGTM; Elasticsearch reserved for product search

Every service emits telemetry through OpenTelemetry, wrapped in one observability module in `@ecom-micro/common` (and a Go equivalent in `review`). Logs go to stdout as JSON. Traces and metrics go over OTLP to Grafana Alloy, which fans out to Loki (logs), Tempo (traces) and Prometheus (metrics), with Grafana and Alertmanager on top, all self-hosted in the cluster. We moved logging off Elasticsearch because that cluster also serves `product` search, and the old `winston-elasticsearch` transport put log volume and a blocking network call on the same path customers search through. We picked LGTM because it links logs, traces and metrics natively, and because the team already proved Prometheus, Grafana and OTel in `sandbox/observability-learning`.

Full design: `.scratch/observability-platform/spec.md`.

## Considered Options

- **Keep ELK for logs (status quo).** Rejected. It shares the product-search Elasticsearch, has no trace or metrics story, and needs Kibana for a job Grafana can do.
- **A separate Elasticsearch cluster just for logs.** Rejected. It removes the coupling, but you'd run two Elasticsearch clusters and still need a separate tracing and metrics stack with weaker cross-signal linking.
- **Managed SaaS (Grafana Cloud, Datadog, New Relic).** Rejected for now. It adds cost and an external dependency to a lab environment. Since services only speak OTLP, moving later only means reconfiguring the collector, not re-instrumenting.
- **Services push directly to each backend.** Rejected. It couples every service to backend addresses and gives redaction and sampling no central place to live.

## Consequences

- **Instrumentation lives in `common`.** Services never import a Loki, Tempo or Prometheus client. New cross-cutting telemetry goes into `common` and ships with a version bump, the same rule as events and errors.
- **Trace context travels in AMQP message headers, never in event payloads.** Event contracts stay unchanged.
- **Kibana is no longer part of observability** and leaves the skaffold profiles once no service logs to Elasticsearch. Elasticsearch now serves product search only. Don't point any logging or telemetry at it.
- **Services must keep working with the collector down.** Telemetry export is best-effort and must never block a request or message handler.
