import {
  BasePublisher,
  ProductDeletedMessage,
  RoutingKeyTypes,
  ExchangeTypes,
} from "@ecom-micro/common";

export class ProductDeletePub extends BasePublisher<ProductDeletedMessage> {
  exchangeName: ExchangeTypes.ProductService = ExchangeTypes.ProductService;
  routingKey: RoutingKeyTypes.ProductDeleted = RoutingKeyTypes.ProductDeleted;
}
