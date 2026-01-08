# 🔗 Integration Guide: Applying Observability to Your E-commerce Project

This guide shows how to integrate the observability patterns you've learned into your actual microservices.

## Current Services to Instrument

- `auth` - Authentication service
- `product` - Product catalog
- `cart` - Shopping cart
- `order` - Order processing
- `notification` - Email/SMS notifications
- `etl-service` - Data pipeline

## Step 1: Add Correlation IDs to All Services

### Update Common Package

Add to `common/src/middleware/correlationId.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AsyncLocalStorage } from 'async_hooks';

export const correlationStorage = new AsyncLocalStorage<Map<string, string>>();

export const correlationIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const correlationId = (req.headers['x-correlation-id'] as string) || uuidv4();
  res.setHeader('x-correlation-id', correlationId);
  
  const store = new Map();
  store.set('correlationId', correlationId);
  
  correlationStorage.run(store, () => {
    next();
  });
};
```

### Apply to Each Service

In `auth/src/app.ts`:
```typescript
import { correlationIdMiddleware } from '@ecommerce/common';

app.use(correlationIdMiddleware);
```

## Step 2: Implement Structured Logging

### Update Logger Configuration

In each service, replace console.log with structured logging:

```typescript
// auth/src/utils/logger.ts
import pino from 'pino';
import { correlationStorage } from '@ecommerce/common';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    bindings: () => ({
      service: 'auth-service',
      environment: process.env.NODE_ENV,
      version: process.env.APP_VERSION
    })
  }
});

export const log = {
  info: (msg: string, obj?: any) => {
    const store = correlationStorage.getStore();
    logger.info({ correlationId: store?.get('correlationId'), ...obj }, msg);
  },
  error: (msg: string, obj?: any) => {
    const store = correlationStorage.getStore();
    logger.error({ correlationId: store?.get('correlationId'), ...obj }, msg);
  }
};
```

### Log at Key Points

```typescript
// auth/src/controllers/login.controller.ts
log.info('User login attempt', {
  event: 'auth.login.attempt',
  email: req.body.email,
  ip: req.ip
});

// After successful login
log.info('User logged in successfully', {
  event: 'auth.login.success',
  userId: user.id,
  email: user.email
});

// On failure
log.warn('Login failed', {
  event: 'auth.login.failed',
  email: req.body.email,
  reason: 'invalid_credentials'
});
```

## Step 3: Add OpenTelemetry Tracing

### Install Dependencies

```bash
cd auth
npm install @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node \
            @opentelemetry/exporter-trace-otlp-http @opentelemetry/api
```

### Initialize Tracing

Create `auth/src/tracing.ts`:
```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

export function initTracing() {
  const exporter = new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://jaeger:4318/v1/traces',
  });

  const sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: 'auth-service',
      [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
    }),
    traceExporter: exporter,
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start();
}
```

### Add to Service Entry Point

In `auth/src/index.ts`:
```typescript
import { initTracing } from './tracing';

// Initialize tracing BEFORE other imports
initTracing();

import express from 'express';
// ... rest of imports
```

## Step 4: Add Metrics with Prometheus

### Install Prometheus Client

```bash
npm install prom-client
```

### Create Metrics

```typescript
// common/src/metrics/index.ts
import { register, Counter, Histogram, Gauge } from 'prom-client';

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code', 'service'],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code', 'service'],
});

export const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  labelNames: ['service'],
});

// Business metrics
export const ordersCreated = new Counter({
  name: 'orders_created_total',
  help: 'Total number of orders created',
  labelNames: ['status', 'payment_method'],
});

export const cartValue = new Histogram({
  name: 'cart_value_dollars',
  help: 'Value of shopping carts',
  buckets: [10, 50, 100, 200, 500, 1000],
});
```

### Add Metrics Endpoint

```typescript
// In each service's app.ts
import { register } from 'prom-client';

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

## Step 5: Update Kubernetes Deployments

### Add Jaeger to K8s

Create `k8s/jaeger-depl.yml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: jaeger-depl
spec:
  replicas: 1
  selector:
    matchLabels:
      app: jaeger
  template:
    metadata:
      labels:
        app: jaeger
    spec:
      containers:
      - name: jaeger
        image: jaegertracing/all-in-one:latest
        env:
        - name: COLLECTOR_OTLP_ENABLED
          value: "true"
        ports:
        - containerPort: 16686  # UI
        - containerPort: 4318   # OTLP HTTP
---
apiVersion: v1
kind: Service
metadata:
  name: jaeger-srv
spec:
  selector:
    app: jaeger
  ports:
  - name: ui
    protocol: TCP
    port: 16686
    targetPort: 16686
  - name: otlp
    protocol: TCP
    port: 4318
    targetPort: 4318
```

### Update Service Configs

Add to `k8s/config/auth-config.yml`:
```yaml
data:
  OTEL_EXPORTER_OTLP_ENDPOINT: "http://jaeger-srv:4318"
  LOG_LEVEL: "info"
```

## Step 6: Create Grafana Dashboards

### Dashboard Configuration

Create `k8s/grafana-dashboards/ecommerce-dashboard.json`:
```json
{
  "dashboard": {
    "title": "E-commerce Microservices",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [{
          "expr": "rate(http_requests_total[5m])"
        }]
      },
      {
        "title": "Error Rate",
        "targets": [{
          "expr": "rate(http_requests_total{status_code=~'5..'}[5m])"
        }]
      },
      {
        "title": "P95 Latency",
        "targets": [{
          "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
        }]
      },
      {
        "title": "Orders per Hour",
        "targets": [{
          "expr": "rate(orders_created_total[1h]) * 3600"
        }]
      }
    ]
  }
}
```

## Step 7: Implement Circuit Breakers

Add to services that call other services:

```typescript
// order/src/utils/circuitBreaker.ts
import CircuitBreaker from 'opossum';
import axios from 'axios';

const options = {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000
};

export const inventoryBreaker = new CircuitBreaker(
  async (url: string, data: any) => {
    return await axios.post(url, data);
  },
  options
);

inventoryBreaker.fallback(() => {
  return { available: false, message: 'Inventory service unavailable' };
});
```

## Step 8: Testing the Integration

### Local Testing Script

Create `scripts/test-observability.sh`:
```bash
#!/bin/bash

echo "Testing observability stack..."

# Generate load
for i in {1..100}; do
  curl -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -H "X-Correlation-ID: test-$i" \
    -d '{"email": "test@example.com", "password": "password"}' &
done

wait

echo "Check:"
echo "- Logs: docker logs auth-service | grep correlationId"
echo "- Traces: http://localhost:16686"
echo "- Metrics: http://localhost:3000/auth/metrics"
```

## Rollout Plan

### Phase 1: Non-Production (Week 1)
1. Add correlation IDs to all services
2. Implement structured logging
3. Deploy to dev environment

### Phase 2: Tracing (Week 2)
1. Add OpenTelemetry to critical path (checkout flow)
2. Deploy Jaeger to staging
3. Test and tune

### Phase 3: Metrics & Dashboards (Week 3)
1. Add Prometheus metrics
2. Create Grafana dashboards
3. Set up basic alerts

### Phase 4: Production (Week 4)
1. Deploy to production with feature flags
2. Monitor and adjust
3. Train team on tools

## Common Issues & Solutions

### Issue: Traces not appearing in Jaeger
- Check OTEL_EXPORTER_OTLP_ENDPOINT environment variable
- Verify Jaeger is running: `curl http://localhost:16686`
- Check service logs for export errors

### Issue: High memory usage from tracing
- Adjust batch size in exporter configuration
- Implement sampling (only trace 10% of requests in production)

### Issue: Correlation IDs not propagating
- Ensure middleware is registered before route handlers
- Check that HTTP clients include the header

## Next Steps

1. Implement distributed tracing in your checkout flow
2. Create custom business metrics
3. Set up alerting rules
4. Build runbooks for common issues
