# 05 - Dashboards with Grafana

## What is Grafana?

Grafana is an open-source visualization platform that can query multiple data sources (Prometheus, Elasticsearch, Jaeger) and create beautiful, interactive dashboards.

## Key Concepts

### Data Sources

- **Prometheus**: For metrics
- **Elasticsearch**: For logs
- **Jaeger**: For traces
- **PostgreSQL/MySQL**: For business data

### Panel Types

1. **Graph**: Time series data
2. **Stat**: Single statistics
3. **Gauge**: Progress/utilization
4. **Table**: Tabular data
5. **Heatmap**: Distribution over time
6. **Alert List**: Active alerts

### Variables

Dashboard variables allow dynamic filtering:

- `$service` - Select which service to view
- `$environment` - Switch between dev/staging/prod
- `$time_range` - Adjust time window

### Annotations

Mark important events on graphs:

- Deployments
- Incidents
- Feature releases

## Dashboard Design Principles

### 1. Overview First

Start with high-level KPIs, drill down to details.

### 2. RED Method Dashboard

- **Rate**: Requests per second
- **Errors**: Error percentage
- **Duration**: Latency percentiles

### 3. USE Method Dashboard

- **Utilization**: How busy is the resource?
- **Saturation**: How much work is queued?
- **Errors**: Are errors occurring?

### 4. Business Dashboard

- Orders per hour
- Revenue trends
- Conversion funnel
- Customer satisfaction

## What You'll Build

1. **System Overview Dashboard**: Health of all services
2. **RED Method Dashboard**: Service performance
3. **Business KPI Dashboard**: E-commerce metrics
4. **Alert Dashboard**: Current issues
5. **Custom Service Dashboard**: Deep dive per service
