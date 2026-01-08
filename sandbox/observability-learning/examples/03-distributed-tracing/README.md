# Module 03: Distributed Tracing with OpenTelemetry & Jaeger

This module demonstrates distributed tracing across multiple microservices using OpenTelemetry and Jaeger.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Client    │────▶│  API Gateway │────▶│  Order Service  │
└─────────────┘     └──────────────┘     └────────┬────────┘
                                                   │
                            ┌──────────────────────┴─────────────────────┐
                            ▼                                            ▼
                    ┌─────────────────┐                        ┌──────────────────┐
                    │Inventory Service│                        │ Payment Service  │
                    └─────────────────┘                        └──────────────────┘
                            │                                            │
                            └──────────────────┬────────────────────────┘
                                              ▼
                                        ┌──────────┐
                                        │  Jaeger  │
                                        └──────────┘
```

## Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# 1. Start Jaeger
docker-compose up jaeger -d

# 2. Build and start all services
docker-compose up --build

# 3. Make a test request
curl -X POST http://localhost:3000/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "items": [
      {"id": "ITEM-001", "price": 29.99, "quantity": 2},
      {"id": "ITEM-002", "price": 49.99, "quantity": 1}
    ],
    "paymentMethod": "credit_card"
  }'

# 4. View traces in Jaeger UI
open http://localhost:16686
```

### Option 2: Local Development

```bash
# Terminal 1: Start Jaeger
docker run -d --name jaeger \
  -e COLLECTOR_OTLP_ENABLED=true \
  -p 16686:16686 \
  -p 4317:4317 \
  -p 4318:4318 \
  jaegertracing/all-in-one:latest

# Terminal 2-5: Start each service
cd services/gateway && npm install && npm start
cd services/order && npm install && npm start
cd services/inventory && npm install && npm start
cd services/payment && npm install && npm start

# Terminal 6: Test
curl -X POST http://localhost:3000/checkout \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-123", "items": [{"id": "ITEM-001", "price": 29.99}], "paymentMethod": "credit_card"}'
```

## Understanding the Traces

### 1. Open Jaeger UI
Navigate to http://localhost:16686

### 2. Find Your Trace
- Select service: "api-gateway"
- Click "Find Traces"
- Click on a trace to view details

### 3. What You'll See

```
api-gateway: POST /checkout                    [500ms total]
  ├── call-order-service                      [400ms]
  │   └── order-service: POST /orders         [380ms]
  │       ├── check-inventory                 [100ms]
  │       │   └── inventory-service: POST /inventory/check [80ms]
  │       │       └── database-query          [30ms]
  │       ├── process-payment                 [200ms]
  │       │   └── payment-service: POST /payments [190ms]
  │       │       ├── validate-payment-method [20ms]
  │       │       ├── fraud-check            [50ms]
  │       │       ├── payment-gateway-call   [100ms]
  │       │       └── record-transaction     [20ms]
  │       └── save-order-to-database         [50ms]
```

### 4. Key Features to Explore

- **Span Details**: Click on any span to see attributes, events, and timing
- **Service Map**: View service dependencies
- **Critical Path**: Identify bottlenecks
- **Error Traces**: Filter for failed requests

## Testing Scenarios

### Successful Checkout
```bash
curl -X POST http://localhost:3000/checkout \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-123", "items": [{"id": "ITEM-001", "price": 99.99}], "paymentMethod": "credit_card"}'
```

### Out of Stock Error
```bash
curl -X POST http://localhost:3000/checkout \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-123", "items": [{"id": "ITEM-003", "price": 99.99}], "paymentMethod": "credit_card"}'
```

### Payment Failure
```bash
curl -X POST http://localhost:3000/checkout \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-123", "items": [{"id": "ITEM-001", "price": 99.99}], "paymentMethod": "invalid"}'
```

## Key Concepts Demonstrated

1. **Context Propagation**: Trace context automatically flows between services
2. **Custom Spans**: Creating spans for specific operations
3. **Span Attributes**: Adding metadata to spans
4. **Span Events**: Recording important moments within a span
5. **Error Handling**: How errors appear in traces
6. **Nested Spans**: Parent-child relationships

## Cleanup

```bash
# Stop all services
docker-compose down

# Remove Jaeger data
docker-compose down -v
```
