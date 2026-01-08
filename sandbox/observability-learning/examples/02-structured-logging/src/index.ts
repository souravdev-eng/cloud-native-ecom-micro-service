import express from 'express';
import { loggingMiddleware, errorLoggingMiddleware } from './middleware';
import { logger } from './logger';
import { simulateDatabase } from './database';
import { businessMetrics } from './metrics';

const app = express();
const port = 4001;

// Set service name for all logs
process.env.SERVICE_NAME = 'order-service';
process.env.APP_VERSION = '2.1.0';

app.use(express.json());
app.use(loggingMiddleware);

// Simulate authentication middleware
app.use((req, res, next) => {
  // In real app, this would validate JWT
  if (req.headers.authorization) {
    (req as any).user = {
      id: 'user-123',
      email: 'john@example.com'
    };
  }
  next();
});

// Business event logging example
app.post('/orders', async (req, res) => {
  const { items, totalAmount } = req.body;
  
  logger.info('Creating order', {
    event: 'order.create.start',
    itemCount: items?.length,
    totalAmount
  });

  try {
    // Simulate database operation with timing
    const endTimer = logger.time('Database query');
    const order = await simulateDatabase.createOrder(items, totalAmount);
    endTimer();

    // Log business metrics
    businessMetrics.recordOrder(order);
    
    logger.info('Order created successfully', {
      event: 'order.create.success',
      orderId: order.id,
      amount: order.totalAmount,
      itemCount: order.items.length
    });

    res.json(order);
  } catch (error: any) {
    logger.error('Order creation failed', {
      event: 'order.create.failed',
      error: error.message,
      items,
      totalAmount
    });
    throw error;
  }
});

// Search endpoint with performance logging
app.get('/orders/search', async (req, res) => {
  const { query, limit = 10 } = req.query;
  
  logger.info('Searching orders', {
    event: 'order.search',
    searchQuery: query,
    limit
  });

  const endTimer = logger.time('Search operation');
  const results = await simulateDatabase.searchOrders(query as string);
  endTimer();

  logger.info('Search completed', {
    event: 'order.search.complete',
    resultCount: results.length,
    query
  });

  res.json(results);
});

// Health check with structured output
app.get('/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  };

  logger.debug('Health check', {
    event: 'health.check',
    ...health
  });

  res.json(health);
});

// Simulate an error endpoint
app.get('/error', (req, res) => {
  throw new Error('Simulated error for testing');
});

// Error handling
app.use(errorLoggingMiddleware);

// Start server with startup logging
app.listen(port, () => {
  logger.info('Service started', {
    event: 'application.start',
    port,
    environment: process.env.NODE_ENV,
    nodeVersion: process.version
  });
  
  console.log(`
╔════════════════════════════════════════════════════════╗
║     Structured Logging Example - Order Service        ║
╠════════════════════════════════════════════════════════╣
║  Running on: http://localhost:${port}                    ║
║                                                        ║
║  Try these commands:                                  ║
║                                                        ║
║  # Create an order (with auth)                       ║
║  curl -X POST http://localhost:${port}/orders \\         ║
║    -H "Content-Type: application/json" \\             ║
║    -H "Authorization: Bearer fake-token" \\           ║
║    -d '{"items": ["item1", "item2"], "totalAmount": 99.99}'
║                                                        ║
║  # Search orders                                      ║
║  curl http://localhost:${port}/orders/search?query=laptop
║                                                        ║
║  # Trigger an error                                   ║
║  curl http://localhost:${port}/error                    ║
║                                                        ║
║  Watch the structured JSON logs in the console!       ║
╚════════════════════════════════════════════════════════╝
  `);
});
