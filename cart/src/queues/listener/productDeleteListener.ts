import {
  BaseListener,
  ExchangeTypes,
  ProductDeletedMessage,
  RoutingKeyTypes,
} from "@ecom-micro/common";
import { ConsumeMessage, Channel } from "amqplib";
import { Product } from "../../entity/Product";

interface ProductType {
  id: string;
}
export class ProductDeleteListener extends BaseListener<ProductDeletedMessage> {
  exchangeName: ExchangeTypes.ProductService = ExchangeTypes.ProductService;
  routingKey: RoutingKeyTypes.ProductDeleted = RoutingKeyTypes.ProductDeleted;

  async onMessage(data: ProductType, channel: Channel, msg: ConsumeMessage) {
    const product = await Product.findOneBy({ id: data.id });

    if (product) {
      await product.remove();
      console.log("Cart Service Product deleted successfully");
      channel.ack(msg);
    } else {
      console.log("Cart Service Product not found");
      channel.ack(msg);
    }
  }
}
