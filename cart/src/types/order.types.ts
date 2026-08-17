import { ExchangeTypes, RoutingKeyTypes } from '@ecom-micro/common';

/**
 * Contract for the `order-created` event, published by the order service
 * (order/src/queue/publisher/orderCreatedPublisher.ts).
 *
 * Duplicated here on purpose: the shape currently lives in the order service's
 * own src/types/order.types.ts and has not been moved into `common` yet. Now
 * that a second service CONSUMES it, it belongs in common/src/types/ — move it,
 * publish common, and bump both services (see CLAUDE.md). Until then these two
 * copies must be kept in step.
 */
export interface OrderCreatedMessage {
  exchangeName: ExchangeTypes.OrderService;
  routingKey: RoutingKeyTypes.OrderCreated;
  data: {
    orderId: string;
    userId: string;
    status: string;
    totalAmount: number;
    currency: string;
    items: Array<{
      productId: string;
      title: string;
      price: number;
      quantity: number;
    }>;
    createdAt: string;
  };
}
