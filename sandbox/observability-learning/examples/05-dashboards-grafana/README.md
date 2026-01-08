# Module 05: Dashboards with Grafana

This module shows how to create production-ready Grafana dashboards for monitoring your microservices.

## What You'll Learn

- Creating dashboards from scratch
- Using variables for dynamic filtering
- Different visualization types (graphs, gauges, tables, pie charts)
- Setting up alerts
- Combining metrics, logs, and traces in one view
- Dashboard best practices

## Quick Start

```bash
# Start the entire monitoring stack
docker-compose up --build

# Wait for services to start, then:
# 1. Open Grafana: http://localhost:3003
# 2. Login: admin/admin
# 3. View pre-configured dashboards
# 4. Prometheus: http://localhost:9090
# 5. Elasticsearch: http://localhost:9200
```

## Pre-configured Dashboards

### 1. System Overview Dashboard
- Overall system health
- Success rate gauge
- P95 latency
- Request rate
- Error count
- Service-level metrics

### 2. Business KPIs Dashboard
- Orders per hour
- Revenue metrics
- Conversion rate
- Average order value
- Payment method breakdown
- Inventory levels
- Cart size distribution

### 3. RED Method Dashboard (Create yourself)
- **R**ate: Requests per second
- **E**rrors: Error percentage
- **D**uration: Latency percentiles

## Creating Your Own Dashboard

### Step 1: Add a New Dashboard
1. Click "+" → "Dashboard"
2. Add a new panel
3. Select visualization type

### Step 2: Write PromQL Query
```promql
# Example: Request rate by endpoint
sum by (route) (rate(http_requests_total[5m]))
```

### Step 3: Configure Visualization
- Set units (requests/sec, milliseconds, percent)
- Configure thresholds (green/yellow/red)
- Add legends and tooltips

### Step 4: Add Variables
Dashboard → Settings → Variables:
```
Name: service
Query: label_values(http_requests_total, service)
```

Use in queries:
```promql
rate(http_requests_total{service="$service"}[5m])
```

## Common Dashboard Patterns

### Golden Signals (Google SRE)
1. **Latency**: Response time distribution
2. **Traffic**: Request rate
3. **Errors**: Error rate and types
4. **Saturation**: Resource utilization

### RED Method (Tom Wilkie)
1. **Rate**: How many requests per second
2. **Errors**: What percentage are failing
3. **Duration**: How long do they take

### USE Method (Brendan Gregg)
1. **Utilization**: Average time resource was busy
2. **Saturation**: Queue length or wait time
3. **Errors**: Error count

## Panel Types Guide

### Time Series
Best for: Metrics over time
```promql
rate(http_requests_total[5m])
```

### Stat Panel
Best for: Single values, KPIs
```promql
sum(increase(orders_created_total[1h]))
```

### Gauge
Best for: Percentages, utilization
```promql
(1 - rate(http_errors_total[5m]) / rate(http_requests_total[5m])) * 100
```

### Table
Best for: Top N lists, inventory
```promql
topk(10, inventory_level)
```

### Pie Chart
Best for: Proportions, breakdowns
```promql
sum by (payment_method) (orders_created_total)
```

### Heatmap
Best for: Distribution over time
```promql
http_request_duration_seconds_bucket
```

## Setting Up Alerts

### In Grafana Panel
1. Edit panel → Alert tab
2. Set conditions:
   ```
   WHEN avg() OF query(A, 5m, now) IS ABOVE 0.1
   ```
3. Configure notifications

### In Prometheus (alerts.yml)
```yaml
- alert: HighErrorRate
  expr: rate(http_errors_total[5m]) > 0.05
  for: 2m
  annotations:
    summary: "Error rate is {{ $value | humanizePercentage }}"
```

## Advanced Features

### Annotations
Mark deployments and incidents:
```bash
curl -X POST http://localhost:3003/api/annotations \
  -H "Authorization: Bearer <API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Deployed v2.0",
    "tags": ["deployment", "production"]
  }'
```

### Templating
Create reusable dashboards:
- Use variables for environment, service, region
- Import/export JSON definitions
- Use dashboard provisioning

### Mixed Data Sources
Combine in one panel:
- Metrics from Prometheus
- Logs from Elasticsearch
- Traces from Jaeger

## Dashboard Best Practices

### 1. Information Hierarchy
- Overview at top
- Details below
- Most important metrics visible without scrolling

### 2. Consistent Color Coding
- Green = Good
- Yellow = Warning
- Red = Critical

### 3. Meaningful Titles
- Bad: "Graph 1"
- Good: "Order Processing Latency (P95)"

### 4. Appropriate Time Ranges
- Real-time: Last 5 minutes
- Trends: Last 24 hours
- Analysis: Last 7 days

### 5. Use Annotations
- Mark deployments
- Note incidents
- Highlight changes

## Testing the Dashboards

The load generator creates realistic traffic:
```bash
# Check load generator logs
docker-compose logs load-generator

# Manually generate specific scenarios
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{"items": [{"price": 99.99}], "paymentMethod": "credit_card"}'
```

## Exporting and Sharing

### Export Dashboard
Dashboard → Settings → JSON Model → Copy

### Import Dashboard
Dashboards → Import → Paste JSON

### Share via URL
Dashboard → Share → Link → Copy

## Troubleshooting

### No Data Points
- Check data source configuration
- Verify Prometheus is scraping: http://localhost:9090/targets
- Check time range selector

### Slow Queries
- Use recording rules for expensive queries
- Optimize PromQL (avoid high cardinality)
- Increase refresh interval

### Dashboard Not Loading
- Check Grafana logs: `docker-compose logs grafana`
- Verify data source connectivity
- Clear browser cache

## Useful PromQL Queries for Dashboards

### Service Health Score
```promql
(1 - rate(http_errors_total[5m]) / rate(http_requests_total[5m])) * 100
```

### Apdex Score
```promql
(
  sum(rate(http_request_duration_seconds_bucket{le="0.5"}[5m])) +
  sum(rate(http_request_duration_seconds_bucket{le="2"}[5m])) / 2
) / sum(rate(http_request_duration_seconds_count[5m]))
```

### Error Budget Remaining
```promql
(1 - (1 - 0.99)) - 
(1 - avg_over_time(up[30d]))
```

## Next Steps

1. Create a custom dashboard for your service
2. Set up alerts for your SLIs
3. Export dashboards as code (JSON)
4. Integrate with your CI/CD pipeline
5. Create mobile-friendly dashboards
