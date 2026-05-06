# 🔍 Distributed Tracing & Observability Sandbox

> Learn how to monitor, debug, and understand complex distributed systems using the Three Pillars of Observability: Logs, Metrics, and Traces.

---

## 📋 Learning Modules

| # | Module | Description | Status |
| --- | --- | --- | --- |
| 01 | **Correlation IDs** | Tracking requests across service boundaries | ✅ Completed |
| 02 | **Structured Logging** | Making logs machine-readable and searchable | ✅ Completed |
| 03 | **Distributed Tracing** | Visualizing request flows with Jaeger/OpenTelemetry | ✅ Completed |
| 04 | **Metrics with Prometheus** | Collecting and querying system/business metrics | ✅ Completed |
| 05 | **Dashboards with Grafana** | Visualizing metrics and traces | ✅ Completed |
| 06 | **Alerting Strategies** | Getting notified before users notice issues | 🔲 Pending |
| 07 | **Log Aggregation (ELK)** | Centralizing and searching logs | 🔲 Pending |
| 08 | **Full APM Integration** | Putting it all together | 🔲 Pending |

---

## 🏗️ What We're Building

In this sandbox, we will implement a complete observability stack for a mini-microservices environment. We'll start with simple correlation IDs and move towards a full OpenTelemetry setup.

### The Three Pillars

1.  **Logs**: "What happened?" (Structured JSON logs)
2.  **Metrics**: "How much/often?" (CPU, Request Rates, Error counts)
3.  **Traces**: "Where did the request go?" (Service-to-service spans)

---

## 🚀 Getting Started

1.  **Prerequisites**: Node.js, Docker, and basic knowledge of Express.js.
2.  **Navigate to a module**: `cd 01-correlation-ids/`
3.  **Follow the instructions** in the module's `README.md`.

---

## 📚 Documentation

Detailed guides can be found in the [docs/](./docs/) folder:

- [Overview & Three Pillars](./docs/00-overview.md)
- [Correlation IDs Guide](./docs/01-correlation-ids.md)
- [Structured Logging Guide](./docs/02-structured-logging.md)
- [Distributed Tracing Guide](./docs/03-tracing.md)

---

## 🔗 Integration with Main Project

Once mastered, these patterns will be applied to:

- `auth` service
- `product` service
- `order` service
- `cart` service
