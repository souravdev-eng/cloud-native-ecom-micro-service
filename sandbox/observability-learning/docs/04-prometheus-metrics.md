# 04 - Metrics with Prometheus

## What are Metrics?

Metrics are numerical measurements collected over time. Unlike logs (events) or traces (request paths), metrics give you aggregated views of system behavior.

## The Four Golden Signals (Google SRE)

1. **Latency**: Time to service a request
2. **Traffic**: How much demand on your system
3. **Errors**: Rate of failed requests
4. **Saturation**: How "full" your service is

## Prometheus Concepts

### Metric Types

1. **Counter**: Only goes up (requests served, errors)

   ```
   http_requests_total{method="GET", status="200"} 1234
   ```

2. **Gauge**: Can go up or down (memory usage, queue size)

   ```
   memory_usage_bytes 523829248
   ```

3. **Histogram**: Samples observations into buckets (request duration)

   ```
   http_request_duration_seconds_bucket{le="0.1"} 100
   http_request_duration_seconds_bucket{le="0.5"} 150
   http_request_duration_seconds_bucket{le="1.0"} 175
   ```

4. **Summary**: Similar to histogram but calculates quantiles

### Labels

Labels create dimensions for metrics:

```
http_requests_total{method="POST", endpoint="/orders", status="200"} 42
http_requests_total{method="GET", endpoint="/products", status="404"} 3
```

### PromQL (Prometheus Query Language)

```promql
# Request rate over last 5 minutes
rate(http_requests_total[5m])

# 95th percentile latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Error rate percentage
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) * 100
```

## Push vs Pull Model

- **Prometheus uses PULL**: It scrapes metrics from `/metrics` endpoints
- **Push Gateway**: For short-lived jobs that can't be scraped

## What You'll Build

1. Instrumented microservices exposing metrics
2. Prometheus server scraping metrics
3. Custom business metrics
4. Application performance metrics
5. RED method dashboard (Rate, Errors, Duration)
