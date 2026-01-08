import { register, Counter, Histogram, Gauge, Summary } from 'prom-client';

// Enable default metrics (CPU, memory, etc.)
import { collectDefaultMetrics } from 'prom-client';
collectDefaultMetrics({ register });

// ============================================
// HTTP Metrics (RED Method)
// ============================================

// R - Rate: Request counter
export const httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code', 'service'],
});

// E - Errors: Error counter
export const httpErrorsTotal = new Counter({
    name: 'http_errors_total',
    help: 'Total number of HTTP errors',
    labelNames: ['method', 'route', 'error_type', 'service'],
});

// D - Duration: Request duration histogram
export const httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code', 'service'],
    buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

// ============================================
// Business Metrics
// ============================================

// Order metrics
export const ordersCreated = new Counter({
    name: 'orders_created_total',
    help: 'Total number of orders created',
    labelNames: ['status', 'payment_method', 'channel'],
});

export const orderValue = new Histogram({
    name: 'order_value_dollars',
    help: 'Order value in dollars',
    labelNames: ['payment_method', 'channel'],
    buckets: [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
});

export const orderProcessingDuration = new Histogram({
    name: 'order_processing_duration_seconds',
    help: 'Time taken to process an order',
    labelNames: ['status'],
    buckets: [0.5, 1, 2, 5, 10, 30, 60, 120, 300],
});

// Cart metrics
export const cartSize = new Histogram({
    name: 'cart_size_items',
    help: 'Number of items in cart',
    buckets: [1, 2, 3, 5, 10, 20, 50, 100],
});

export const cartAbandoned = new Counter({
    name: 'cart_abandoned_total',
    help: 'Number of abandoned carts',
    labelNames: ['reason'],
});

// Inventory metrics
export const inventoryLevel = new Gauge({
    name: 'inventory_level',
    help: 'Current inventory level',
    labelNames: ['product_id', 'product_name', 'category'],
});

export const stockoutEvents = new Counter({
    name: 'stockout_events_total',
    help: 'Number of times an item went out of stock',
    labelNames: ['product_id', 'product_name'],
});

// Payment metrics
export const paymentAttempts = new Counter({
    name: 'payment_attempts_total',
    help: 'Total payment attempts',
    labelNames: ['method', 'status', 'failure_reason'],
});

export const paymentDuration = new Histogram({
    name: 'payment_processing_duration_seconds',
    help: 'Time to process payment',
    labelNames: ['method', 'gateway'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
});

// ============================================
// System Metrics
// ============================================

export const activeConnections = new Gauge({
    name: 'active_connections',
    help: 'Number of active connections',
    labelNames: ['service'],
});

export const queueSize = new Gauge({
    name: 'queue_size',
    help: 'Number of items in processing queue',
    labelNames: ['queue_name', 'service'],
});

export const cacheHitRate = new Counter({
    name: 'cache_operations_total',
    help: 'Cache operations',
    labelNames: ['operation', 'result'], // operation: get/set, result: hit/miss
});

// ============================================
// Database Metrics
// ============================================

export const dbQueryDuration = new Histogram({
    name: 'database_query_duration_seconds',
    help: 'Database query duration',
    labelNames: ['operation', 'table', 'service'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
});

export const dbConnectionPool = new Gauge({
    name: 'database_connection_pool_size',
    help: 'Database connection pool metrics',
    labelNames: ['state'], // state: active/idle/waiting
});

// ============================================
// Custom Business KPIs
// ============================================

export const conversionRate = new Gauge({
    name: 'conversion_rate_percentage',
    help: 'Conversion rate from cart to order',
    labelNames: ['channel'],
});

export const averageOrderValue = new Gauge({
    name: 'average_order_value_dollars',
    help: 'Average order value in dollars',
    labelNames: ['period'], // period: hourly/daily/weekly
});

export const customerSatisfactionScore = new Gauge({
    name: 'customer_satisfaction_score',
    help: 'Customer satisfaction score (1-5)',
    labelNames: ['category'],
});

// Export the registry for the /metrics endpoint
export { register };
