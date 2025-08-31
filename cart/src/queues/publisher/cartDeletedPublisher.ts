import {
  BasePublisher,
  ExchangeTypes,
  RoutingKeyTypes,
  CartDeletedMessage,
} from '@ecom-micro/common';

export class CartDeletedPublisher extends BasePublisher<CartDeletedMessage> {
  exchangeName: ExchangeTypes.CartService = ExchangeTypes.CartService;
  routingKey: RoutingKeyTypes.CartDeleted = RoutingKeyTypes.CartDeleted;
}
