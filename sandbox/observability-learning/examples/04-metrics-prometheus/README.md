# Module 04: Metrics with Prometheus

This module demonstrates how to instrument applications with Prometheus metrics and query them effectively.

## What You'll Learn

- The four types of Prometheus metrics (Counter, Gauge, Histogram, Summary)
- How to instrument your application with custom metrics
- Business metrics vs system metrics
- PromQL queries for insights
- The RED method (Rate, Errors, Duration)
- The USE method (Utilization, Saturation, Errors)

## Quick Start

### Option 1: Docker Compose

```bash
# Start Prometheus and the sample app
docker-compose up --build

# Generate some traffic
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{"items": [{"price": 99.99}], "paymentMethod": "credit_card"}'

# View metrics
curl http://localhost:3000/metrics

# Open Prometheus UI
open http://localhost:9090
```

### Option 2: Local Development

```bash
# Terminal 1: Start Prometheus
docker run -p 9090:9090 -v $(pwd)/prometheus.yml:/etc/prometheus/prometheus.yml prom/prometheus

# Terminal 2: Start the app
cd src
npm install
npm start

# Terminal 3: Generate traffic
./test-endpoints.sh
```

## Key Metrics Implemented

### HTTP Metrics (RED Method)
- `http_requests_total` - Request rate
- `http_errors_total` - Error rate
- `http_request_duration_seconds` - Request duration

### Business Metrics
- `orders_created_total` - Orders by status and payment method
- `order_value_dollars` - Order value distribution
- `cart_size_items` - Cart size histogram
- `payment_attempts_total` - Payment success/failure
- `inventory_level` - Current stock levels

### System Metrics
- `active_connections` - Current connections
- `queue_size` - Items in processing queues
- `cache_operations_total` - Cache hit/miss rates
- `database_query_duration_seconds` - DB performance

## PromQL Examples

Try these queries in Prometheus (http://localhost:9090):

### Request Rate (last 5 minutes)
```promql
rate(http_requests_total[5m])
```

### Error Percentage
```promql
(rate(http_requests_total{status_code=~"5.."}[5m]) / rate(http_requests_total[5m])) * 100
```

### 95th Percentile Latency
```promql
histogram_quantile(0.95, 
  sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
)
```

### Orders Per Hour
```promql
increase(orders_created_total{status="success"}[1h])
```

### Average Order Value
```promql
rate(order_value_dollars_sum[5m]) / rate(order_value_dollars_count[5m])
```

### Cart Abandonment Rate
```promql
rate(cart_abandoned_total[1h]) / 
(rate(cart_abandoned_total[1h]) + rate(orders_created_total[1h])) * 100
```

## Testing Different Scenarios

### Successful Order Flow
```bash
# Add to cart
curl -X POST http://localhost:3000/cart/user-123/items \
  -H "Content-Type: application/json" \
  -d '{"items": [{"id": "ITEM-001", "price": 29.99, "quantity": 2}]}'

# Create order
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{"items": [{"price": 29.99}], "paymentMethod": "credit_card", "userId": "user-123"}'

# Process payment
curl -X POST http://localhost:3000/payments \
  -H "Content-Type: application/json" \
  -d '{"amount": 59.98, "method": "credit_card", "orderId": "ORD-123"}'
```

### Cart Abandonment
```bash
curl -X DELETE "http://localhost:3000/cart/user-456?reason=price_too_high"
```

### Check Inventory
```bash
curl http://localhost:3000/inventory/ITEM-001
```

## Understanding Histograms

Histograms create buckets for value distributions:

```promql
# See all buckets for request duration
http_request_duration_seconds_bucket

# Calculate percentiles
histogram_quantile(0.5, ...) # Median
histogram_quantile(0.95, ...) # 95th percentile
histogram_quantile(0.99, ...) # 99th percentile
```

## Best Practices

1. **Use labels wisely** - Too many label combinations create high cardinality
2. **Choose appropriate bucket sizes** - Match your SLAs
3. **Instrument at service boundaries** - Incoming requests, outgoing calls, DB queries
4. **Track business KPIs** - Not just technical metrics
5. **Use consistent naming** - Follow Prometheus naming conventions

## Troubleshooting

### Metrics not appearing in Prometheus
- Check if the target is up: http://localhost:9090/targets
- Verify the `/metrics` endpoint: `curl http://localhost:3000/metrics`
- Check Prometheus logs: `docker-compose logs prometheus`

### High memory usage
- Reduce metric cardinality (fewer label combinations)
- Increase scrape interval
- Use recording rules for expensive queries

## Next Steps

Continue to Module 05 to visualize these metrics in Grafana dashboards!
