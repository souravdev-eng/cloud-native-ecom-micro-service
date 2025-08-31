import {
  BaseListener,
  ExchangeTypes,
  CartCreatedMessage,
  RoutingKeyTypes,
} from '@ecom-micro/common';
import { Cart } from '../../models/cart';
import { Channel, ConsumeMessage } from 'amqplib';

export class CartCreatedListener extends BaseListener<CartCreatedMessage> {
  exchangeName: ExchangeTypes.CartService = ExchangeTypes.CartService;
  routingKey: RoutingKeyTypes.CartCreated = RoutingKeyTypes.CartCreated;

  async onMessage(
    data: {
      cartId: string;
      userId: string;
      product: {
        id: string;
        title: string;
        price: number;
        image: string;
        sellerId: string;
        quantity: number;
      };
      cartQuantity: number;
      total: number;
      version: number;
    },
    channel: Channel,
    msg: ConsumeMessage
  ) {
    try {
      console.log('CartCreatedListener received data:', data);

      const { cartId, userId, product, cartQuantity, total, version } = data;

      const cart = Cart.build({
        cartId,
        userId,
        productId: product.id,
        productTitle: product.title,
        productPrice: product.price,
        productImage: product.image,
        sellerId: product.sellerId,
        productQuantity: product.quantity,
        cartQuantity,
        total,
        version,
      });

      await cart.save();

      console.log(`Cart snapshot created for cart: ${cartId} by user: ${userId}`);

      channel.ack(msg);
    } catch (error) {
      console.error('Error processing CartCreatedMessage:', error);
      // Don't ack the message so it can be redelivered
    }
  }
}
