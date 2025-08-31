import {
  BasePublisher,
  ExchangeTypes,
  RoutingKeyTypes,
  CartUpdatedMessage,
} from '@ecom-micro/common';

export class CartUpdatedPublisher extends BasePublisher<CartUpdatedMessage> {
  exchangeName: ExchangeTypes.CartService = ExchangeTypes.CartService;
  routingKey: RoutingKeyTypes.CartUpdated = RoutingKeyTypes.CartUpdated;
}
