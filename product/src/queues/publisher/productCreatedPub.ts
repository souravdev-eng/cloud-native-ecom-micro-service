import {
  BasePublisher,
  ProductCreatedMessage,
  RoutingKeyTypes,
  ExchangeTypes,
} from '@ecom-micro/common';

export class ProductCreatedPub extends BasePublisher<ProductCreatedMessage> {
  exchangeName: ExchangeTypes.ProductService = ExchangeTypes.ProductService;
  routingKey: RoutingKeyTypes.ProductCreated = RoutingKeyTypes.ProductCreated;
}
