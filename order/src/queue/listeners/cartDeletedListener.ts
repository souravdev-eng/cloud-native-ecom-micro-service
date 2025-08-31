import {
  BaseListener,
  ExchangeTypes,
  CartDeletedMessage,
  RoutingKeyTypes,
} from '@ecom-micro/common';
import { ConsumeMessage, Channel } from 'amqplib';
import { Cart } from '../../models/cart';

export class CartDeletedListener extends BaseListener<CartDeletedMessage> {
  exchangeName: ExchangeTypes.CartService = ExchangeTypes.CartService;
  routingKey: RoutingKeyTypes.CartDeleted = RoutingKeyTypes.CartDeleted;

  async onMessage(
    data: {
      cartId: string;
      userId: string;
      version: number;
    },
    channel: Channel,
    msg: ConsumeMessage
  ) {
    try {
      console.log('CartDeletedListener received data:', data);

      const { cartId, userId, version } = data;

      // Find and delete the cart snapshot
      const cart = await Cart.findOne({
        cartId,
        version: version - 1, // Previous version for optimistic concurrency
      });

      if (!cart) {
        console.error(`Cart not found for deletion: ${cartId} with version ${version - 1}`);
        // Still ack the message as the cart doesn't exist anyway
        channel.ack(msg);
        return;
      }

      await Cart.deleteOne({ _id: cart._id });

      console.log(`Cart snapshot deleted for cart: ${cartId} by user: ${userId}`);

      // Acknowledge the message
      channel.ack(msg);
    } catch (error) {
      console.error('Error processing CartDeletedMessage:', error);
      // Don't ack the message so it can be redelivered
    }
  }
}
