import {
  BasePublisher,
  ExchangeTypes,
  RoutingKeyTypes,
  ProductQuantityUpdatedMessage,
} from '@ecom-micro/common';

export class ProductQuantityUpdatePublisher extends BasePublisher<ProductQuantityUpdatedMessage> {
  exchangeName: ExchangeTypes.ProductService = ExchangeTypes.ProductService;
  routingKey: RoutingKeyTypes.ProductQuantityUpdated = RoutingKeyTypes.ProductQuantityUpdated;
}
