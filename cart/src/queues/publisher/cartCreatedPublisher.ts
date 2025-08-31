import {
  BasePublisher,
  ExchangeTypes,
  RoutingKeyTypes,
  CartCreatedMessage,
} from '@ecom-micro/common';

export class CartCreatedPublisher extends BasePublisher<CartCreatedMessage> {
  exchangeName: ExchangeTypes.CartService = ExchangeTypes.CartService;
  routingKey: RoutingKeyTypes.CartCreated = RoutingKeyTypes.CartCreated;
}
