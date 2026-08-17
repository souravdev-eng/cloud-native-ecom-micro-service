import { BasePublisher, ExchangeTypes, RoutingKeyTypes } from "@ecom-micro/common";
import { OrderCreatedMessage } from "../../types/order.types";

/**
 * Announces a new order. BasePublisher asserts the exchange and publishes the
 * JSON payload — we only pick the exchange + routing key it goes out on.
 * Consumers: product (reserve stock), notification (order confirmation email).
 */
export class OrderCreatedPublisher extends BasePublisher<OrderCreatedMessage> {
  exchangeName: ExchangeTypes.OrderService = ExchangeTypes.OrderService;
  routingKey: RoutingKeyTypes.OrderCreated = RoutingKeyTypes.OrderCreated;
}
