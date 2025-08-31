import {
  BaseListener,
  ExchangeTypes,
  CartUpdatedMessage,
  RoutingKeyTypes,
} from '@ecom-micro/common';
import { Channel, ConsumeMessage } from 'amqplib';
import { Cart } from '../../models/cart';

export class CartUpdatedListener extends BaseListener<CartUpdatedMessage> {
  exchangeName: ExchangeTypes.CartService = ExchangeTypes.CartService;
  routingKey: RoutingKeyTypes.CartUpdated = RoutingKeyTypes.CartUpdated;

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
      console.log('CartUpdatedListener received data:', data);

      const { cartId, userId, product, cartQuantity, total, version } = data;

      // Find existing cart by ID and previous version for optimistic concurrency
      const cart = await Cart.findByEvent({ cartId, version });

      if (!cart) {
        console.error(`Cart not found for update: ${cartId} with version ${version - 1}`);
        channel.ack(msg); // Ack anyway as cart doesn't exist
        return;
      }

      // Update cart snapshot with new data
      cart.productId = product.id;
      cart.productTitle = product.title;
      cart.productPrice = product.price;
      cart.productImage = product.image;
      cart.sellerId = product.sellerId;
      cart.productQuantity = product.quantity;
      cart.cartQuantity = cartQuantity;
      cart.total = total;
      cart.version = version;

      await cart.save();

      console.log(`Cart snapshot updated for cart: ${cartId} by user: ${userId}`);

      // Acknowledge the message
      channel.ack(msg);
    } catch (error) {
      console.error('Error processing CartUpdatedMessage:', error);
      // Don't ack the message so it can be redelivered
    }
  }
}
