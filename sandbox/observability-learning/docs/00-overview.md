# 00 - Overview & The Three Pillars of Observability

## What is Observability?

In distributed systems, observability is the ability to understand the internal state of a system by looking at the data it produces. It's not just "monitoring" (knowing *when* something is wrong); it's about being able to answer "why" something is wrong without deploying new code.

## The Three Pillars

### 1. Logs (The "What")
Logs are discrete records of events. In microservices, logs MUST be:
- **Structured**: JSON format instead of plain text.
- **Contextual**: Include Request IDs, User IDs, and Service names.
- **Aggregated**: Collected in a central place like Elasticsearch.

### 2. Metrics (The "How much/often")
Metrics are aggregatable numeric data. They are perfect for:
- **Dashboards**: Visualizing trends over time.
- **Alerting**: "Alert if error rate > 5% for 2 minutes".
- **Golden Signals**: Latency, Traffic, Errors, Saturation.

### 3. Traces (The "Where")
Traces represent the entire journey of a request as it moves through various services.
- **Span**: A single unit of work (e.g., a database query).
- **Trace**: A collection of spans that share a Trace ID.
- **Distributed Tracing**: Tracking requests across service boundaries (HTTP, RPC, Queues).

## Why do we need this?

1. **Debugging "Ghost" Issues**: When a request fails in Service D but the root cause was a timeout in Service A.
2. **Performance Bottlenecks**: Identifying which specific database query or API call is slowing down the checkout.
3. **Business Insights**: Seeing how long it takes for a user to complete a purchase from start to finish.

## Our Roadmap

We will start with the simplest form of tracking—**Correlation IDs**—which allows us to tie logs from different services together. Then we'll evolve into structured logging, and finally, full distributed tracing with OpenTelemetry and Jaeger.

