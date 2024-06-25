import {
  BasePublisher,
  ProductUpdatedMessage,
  RoutingKeyTypes,
  ExchangeTypes,
} from '@ecom-micro/common';

export class ProductUpdatePub extends BasePublisher<ProductUpdatedMessage> {
  exchangeName: ExchangeTypes.ProductService = ExchangeTypes.ProductService;
  routingKey: RoutingKeyTypes.ProductUpdated = RoutingKeyTypes.ProductUpdated;
}
