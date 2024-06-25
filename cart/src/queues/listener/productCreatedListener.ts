import {
  BaseListener,
  ExchangeTypes,
  ProductCreatedMessage,
  RoutingKeyTypes,
} from '@ecom-micro/common';
import { ConsumeMessage, Channel } from 'amqplib';
import { Product } from '../../entity/Product';

export class ProductCreatedListener extends BaseListener<ProductCreatedMessage> {
  exchangeName: ExchangeTypes.ProductService = ExchangeTypes.ProductService;
  routingKey: RoutingKeyTypes.ProductCreated = RoutingKeyTypes.ProductCreated;

  async onMessage(
    data: {
      id: string;
      title: string;
      quantity: number;
      price: number;
      image: string;
      sellerId: string;
    },
    channel: Channel,
    msg: ConsumeMessage
  ) {
    const product = Product.create({
      id: data.id,
      title: data.title,
      price: data.price,
      image: data.image,
      quantity: data.quantity,
      sellerId: data.sellerId,
    });

    await product.save();
    channel.ack(msg);
  }
}
