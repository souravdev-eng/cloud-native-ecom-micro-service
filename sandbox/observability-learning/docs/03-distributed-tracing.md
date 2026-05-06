# 03 - Distributed Tracing with OpenTelemetry & Jaeger

## What is Distributed Tracing?

Distributed tracing tracks a request as it flows through multiple services, creating a "trace" that shows:

- Which services were called
- How long each operation took
- Where failures occurred
- The complete request path

## Key Concepts

### Trace

A trace represents the entire journey of a request. It has a unique Trace ID.

### Span

A span represents a single operation within a trace:

- Has a unique Span ID
- Has a parent Span ID (except the root span)
- Contains timing information
- Can have attributes (key-value pairs)
- Can have events (timestamped annotations)

### Context Propagation

Trace context is passed between services via headers:

- `traceparent`: Contains trace ID, span ID, and flags
- `tracestate`: Vendor-specific trace data

## OpenTelemetry

OpenTelemetry (OTel) is the industry standard for observability. It provides:

- APIs for instrumenting code
- SDKs for various languages
- Exporters for sending data to backends (Jaeger, Zipkin, etc.)

## Jaeger

Jaeger is an open-source distributed tracing backend that:

- Stores and queries traces
- Provides a UI for visualization
- Supports various storage backends (Cassandra, Elasticsearch, etc.)

## What You'll Build

A multi-service setup with:

1. **API Gateway** - Entry point
2. **Order Service** - Processes orders
3. **Inventory Service** - Checks stock
4. **Payment Service** - Processes payments

Each service will:

- Generate spans for operations
- Propagate context to downstream services
- Export traces to Jaeger
- Include custom attributes and events
