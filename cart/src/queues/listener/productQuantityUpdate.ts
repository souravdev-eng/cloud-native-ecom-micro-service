import {
  BaseListener,
  ExchangeTypes,
  RoutingKeyTypes,
  ProductQuantityUpdatedMessage,
} from '@ecom-micro/common';
import { Channel, ConsumeMessage } from 'amqplib';
import { Product } from '../../entity/Product';

export class ProductQuantityUpdateListener extends BaseListener<ProductQuantityUpdatedMessage> {
  exchangeName: ExchangeTypes.ProductService = ExchangeTypes.ProductService;
  routingKey: RoutingKeyTypes.ProductQuantityUpdated = RoutingKeyTypes.ProductQuantityUpdated;

  async onMessage(
    data: ProductQuantityUpdatedMessage['data'],
    channel: Channel,
    msg: ConsumeMessage
  ) {
    const product = await Product.findOneBy({ id: data.id });
    if (!product) {
      console.log(`Product not found for quantity update: ${data.id}`);
      channel.ack(msg);
      return;
    }
    if (product?.quantity! < data.quantity) {
      console.log(`Product quantity is less than the quantity to update: ${data.id}`);
      channel.ack(msg);
      return;
    }
    product.quantity = product?.quantity! - data.quantity;
    await product.save();
    channel.ack(msg);
  }
}
