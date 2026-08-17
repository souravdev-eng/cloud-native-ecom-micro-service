/* ============================================================================
 * EVENT CONTRACTS published BY this service
 * ============================================================================
 * These live here only until they are moved into `common/src/types/` — once
 * another service needs to CONSUME them, move them there, publish common, and
 * bump the dependency (see CLAUDE.md). The routing keys already exist in common.
 * ========================================================================== */

import { ExchangeTypes, RoutingKeyTypes } from "@ecom-micro/common";

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

export interface OrderCancelledMessage {
  exchangeName: ExchangeTypes.OrderService;
  routingKey: RoutingKeyTypes.OrderCanceled;
  data: {
    orderId: string;
    userId: string;
    // Consumers (product/cart) need the lines to give the stock back.
    items: Array<{ productId: string; quantity: number }>;
  };
}

// Shape the client POSTs to /api/v1/order/new — quantity only; we never trust
// a price coming from the browser.
export interface CreateOrderInput {
  items: Array<{ productId: string; quantity: number }>;
}
