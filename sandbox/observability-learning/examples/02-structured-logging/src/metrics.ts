import { logger } from './logger';

// Business metrics logging
class BusinessMetrics {
  private orderCount = 0;
  private totalRevenue = 0;
  private ordersByStatus: Record<string, number> = {};

  recordOrder(order: any) {
    this.orderCount++;
    this.totalRevenue += order.totalAmount;
    this.ordersByStatus[order.status] = (this.ordersByStatus[order.status] || 0) + 1;

    // Log business metrics
    logger.info('Business metric recorded', {
      event: 'metrics.business',
      metric: 'order.created',
      orderId: order.id,
      amount: order.totalAmount,
      currency: 'USD',
      itemCount: order.items.length,
      dayTotal: this.orderCount,
      dayRevenue: this.totalRevenue
    });

    // Log aggregated metrics every 10 orders
    if (this.orderCount % 10 === 0) {
      this.logAggregatedMetrics();
    }
  }

  private logAggregatedMetrics() {
    logger.info('Aggregated business metrics', {
      event: 'metrics.aggregate',
      period: 'current_session',
      totalOrders: this.orderCount,
      totalRevenue: this.totalRevenue,
      averageOrderValue: this.totalRevenue / this.orderCount,
      ordersByStatus: this.ordersByStatus
    });
  }

  recordPerformance(operation: string, duration: number) {
    logger.info('Performance metric', {
      event: 'metrics.performance',
      operation,
      duration_ms: duration,
      threshold_exceeded: duration > 1000
    });
  }

  recordError(errorType: string, context: any) {
    logger.error('Error metric', {
      event: 'metrics.error',
      errorType,
      context,
      timestamp: new Date().toISOString()
    });
  }
}

export const businessMetrics = new BusinessMetrics();
