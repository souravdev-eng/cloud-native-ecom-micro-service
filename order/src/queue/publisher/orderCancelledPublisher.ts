import { BasePublisher, ExchangeTypes, RoutingKeyTypes } from "@ecom-micro/common";
import { OrderCancelledMessage } from "../../types/order.types";

/**
 * Announces a cancelled order so product can release the reserved stock.
 * Publish this ONLY after the DB transaction commits — otherwise consumers can
 * act on a cancellation that later rolls back.
 */
export class OrderCancelledPublisher extends BasePublisher<OrderCancelledMessage> {
  exchangeName: ExchangeTypes.OrderService = ExchangeTypes.OrderService;
  routingKey: RoutingKeyTypes.OrderCanceled = RoutingKeyTypes.OrderCanceled;
}
