import express from 'express';
import { metricsMiddleware, metricsEndpoint } from './middleware';
import {
    register,
    ordersCreated,
    orderValue,
    orderProcessingDuration,
    cartSize,
    cartAbandoned,
    inventoryLevel,
    paymentAttempts,
    paymentDuration,
    queueSize,
    cacheHitRate,
    dbQueryDuration,
    conversionRate,
    averageOrderValue
} from './metrics';

const app = express();
const port = parseInt(process.env.SERVICE_PORT || '3000');
const serviceName = process.env.SERVICE_NAME || 'ecommerce-api';

app.use(express.json());
app.use(metricsMiddleware(serviceName));

// Metrics endpoint
app.get('/metrics', metricsEndpoint(register));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: serviceName });
});

// ============================================
// E-commerce API Endpoints with Metrics
// ============================================

// Create order endpoint
app.post('/orders', async (req, res) => {
    const startTime = Date.now();
    const { items, paymentMethod, userId } = req.body;

    try {
        // Simulate order processing
        await simulateOrderProcessing(items, paymentMethod);

        // Record business metrics
        const orderTotal = calculateOrderTotal(items);

        ordersCreated.inc({
            status: 'success',
            payment_method: paymentMethod,
            channel: 'web'
        });

        orderValue.observe(
            { payment_method: paymentMethod, channel: 'web' },
            orderTotal
        );

        const processingTime = (Date.now() - startTime) / 1000;
        orderProcessingDuration.observe({ status: 'success' }, processingTime);

        // Update average order value
        updateAverageOrderValue(orderTotal);

        res.json({
            orderId: `ORD-${Date.now()}`,
            total: orderTotal,
            status: 'confirmed'
        });
    } catch (error: any) {
        ordersCreated.inc({
            status: 'failed',
            payment_method: paymentMethod,
            channel: 'web'
        });

        const processingTime = (Date.now() - startTime) / 1000;
        orderProcessingDuration.observe({ status: 'failed' }, processingTime);

        res.status(500).json({ error: error.message });
    }
});

// Add to cart endpoint
app.post('/cart/:userId/items', async (req, res) => {
    const { items } = req.body;
    const { userId } = req.params;

    // Record cart metrics
    cartSize.observe(items.length);

    // Simulate cache operations
    const cacheKey = `cart:${userId}`;
    const cacheHit = Math.random() > 0.3; // 70% cache hit rate

    cacheHitRate.inc({
        operation: 'get',
        result: cacheHit ? 'hit' : 'miss'
    });

    if (!cacheHit) {
        // Simulate database query
        const queryStart = Date.now();
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        dbQueryDuration.observe(
            { operation: 'select', table: 'carts', service: serviceName },
            (Date.now() - queryStart) / 1000
        );
    }

    res.json({
        cartId: `CART-${userId}`,
        itemCount: items.length,
        message: 'Items added to cart'
    });
});

// Abandon cart endpoint
app.delete('/cart/:userId', (req, res) => {
    const { reason = 'user_action' } = req.query;

    cartAbandoned.inc({ reason: reason as string });

    res.json({ message: 'Cart abandoned' });
});

// Check inventory endpoint
app.get('/inventory/:productId', async (req, res) => {
    const { productId } = req.params;

    // Simulate database query
    const queryStart = Date.now();
    await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
    dbQueryDuration.observe(
        { operation: 'select', table: 'inventory', service: serviceName },
        (Date.now() - queryStart) / 1000
    );

    const currentStock = Math.floor(Math.random() * 100);

    // Update inventory gauge
    inventoryLevel.set(
        { product_id: productId, product_name: `Product ${productId}`, category: 'electronics' },
        currentStock
    );

    res.json({
        productId,
        available: currentStock,
        inStock: currentStock > 0
    });
});

// Process payment endpoint
app.post('/payments', async (req, res) => {
    const { amount, method, orderId } = req.body;
    const startTime = Date.now();

    // Simulate payment processing
    const success = Math.random() > 0.1; // 90% success rate

    if (success) {
        const processingTime = Math.random() * 2 + 0.5; // 0.5-2.5 seconds
        await new Promise(resolve => setTimeout(resolve, processingTime * 1000));

        paymentAttempts.inc({
            method,
            status: 'success',
            failure_reason: 'none'
        });

        paymentDuration.observe(
            { method, gateway: 'stripe' },
            processingTime
        );

        res.json({
            transactionId: `TXN-${Date.now()}`,
            status: 'completed',
            amount
        });
    } else {
        paymentAttempts.inc({
            method,
            status: 'failed',
            failure_reason: 'insufficient_funds'
        });

        res.status(400).json({
            error: 'Payment failed',
            reason: 'insufficient_funds'
        });
    }
});

// Queue status endpoint
app.get('/queue/status', (req, res) => {
    // Simulate queue metrics
    queueSize.set({ queue_name: 'order_processing', service: serviceName }, Math.floor(Math.random() * 50));
    queueSize.set({ queue_name: 'email_notifications', service: serviceName }, Math.floor(Math.random() * 100));

    res.json({
        queues: {
            order_processing: queueSize.labels({ queue_name: 'order_processing', service: serviceName }),
            email_notifications: queueSize.labels({ queue_name: 'email_notifications', service: serviceName })
        }
    });
});

// Analytics endpoint - conversion rate
app.get('/analytics/conversion', (req, res) => {
    const rate = Math.random() * 10 + 2; // 2-12% conversion rate

    conversionRate.set({ channel: 'web' }, rate);
    conversionRate.set({ channel: 'mobile' }, rate * 0.7); // Mobile typically lower

    res.json({
        web: rate,
        mobile: rate * 0.7
    });
});

// ============================================
// Helper Functions
// ============================================

async function simulateOrderProcessing(items: any[], paymentMethod: string) {
    // Simulate processing delay
    const delay = Math.random() * 2000 + 500;
    await new Promise(resolve => setTimeout(resolve, delay));

    // Simulate occasional failures
    if (Math.random() > 0.95) {
        throw new Error('Order processing failed');
    }
}

function calculateOrderTotal(items: any[]): number {
    return items.reduce((total, item) => total + (item.price || 0) * (item.quantity || 1), 0);
}

function updateAverageOrderValue(orderTotal: number) {
    // In real implementation, this would calculate based on time window
    averageOrderValue.set({ period: 'hourly' }, orderTotal);
    averageOrderValue.set({ period: 'daily' }, orderTotal * 0.95);
}

// ============================================
// Server Startup
// ============================================

app.listen(port, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║          Prometheus Metrics Example - ${serviceName}         
╠════════════════════════════════════════════════════════════╣
║  Service running on: http://localhost:${port}                
║  Metrics endpoint: http://localhost:${port}/metrics          
║                                                            ║
║  Test Endpoints:                                           ║
║  • POST /orders - Create an order                         ║
║  • POST /cart/:userId/items - Add items to cart           ║
║  • GET /inventory/:productId - Check inventory            ║
║  • POST /payments - Process payment                       ║
║  • GET /analytics/conversion - Get conversion rates       ║
║                                                            ║
║  Prometheus UI: http://localhost:9090                     ║
║  (Run 'docker-compose up' first)                          ║
╚════════════════════════════════════════════════════════════╝
  `);
});
