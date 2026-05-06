import { logger } from './logger';

// Simulated database operations with structured logging
export const simulateDatabase = {
  async createOrder(items: string[], totalAmount: number) {
    // Simulate database latency
    const latency = Math.random() * 200 + 50;
    
    logger.debug('Executing database query', {
      event: 'database.query',
      operation: 'INSERT',
      table: 'orders',
      latency_ms: latency
    });

    await new Promise(resolve => setTimeout(resolve, latency));

    // Simulate occasional failures
    if (Math.random() > 0.9) {
      logger.error('Database connection failed', {
        event: 'database.error',
        error: 'Connection timeout',
        operation: 'INSERT',
        retryable: true
      });
      throw new Error('Database connection timeout');
    }

    const order = {
      id: `ORD-${Date.now()}`,
      items,
      totalAmount,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    logger.debug('Database query successful', {
      event: 'database.success',
      operation: 'INSERT',
      table: 'orders',
      recordId: order.id,
      latency_ms: latency
    });

    return order;
  },

  async searchOrders(query: string) {
    const latency = Math.random() * 100 + 20;
    
    logger.debug('Executing search query', {
      event: 'database.search',
      operation: 'SELECT',
      table: 'orders',
      searchTerm: query,
      latency_ms: latency
    });

    await new Promise(resolve => setTimeout(resolve, latency));

    // Mock search results
    const results = [
      { id: 'ORD-001', description: 'Laptop order', totalAmount: 1299.99 },
      { id: 'ORD-002', description: 'Phone accessories', totalAmount: 49.99 }
    ].filter(order => 
      !query || order.description.toLowerCase().includes(query.toLowerCase())
    );

    logger.debug('Search query completed', {
      event: 'database.search.complete',
      resultCount: results.length,
      latency_ms: latency
    });

    return results;
  }
};
