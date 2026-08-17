import { BaseListener, ExchangeTypes, RoutingKeyTypes } from '@ecom-micro/common';
import { Channel, ConsumeMessage } from 'amqplib';
import { In } from 'typeorm';

import { Cart } from '../../entity/Cart';
import { dbClient } from '../../dbConfig';
import { OrderCreatedMessage } from '../../types/order.types';

/**
 * Clears the checked-out lines from the user's cart once an order exists.
 *
 * Without this the cart survives checkout: the user reloads and the items they
 * just paid for are sitting in the cart again, ready to be ordered twice.
 *
 * We delete ONLY the products that appear on the order, scoped to that order's
 * userId — a cart may legitimately hold items the user chose not to buy, and
 * those must stay.
 *
 * Idempotent by construction: a redelivered event finds nothing left to delete
 * and simply acks. Stock is NOT touched here — that is the product service's
 * job on the same event.
 */
export class OrderCreatedListener extends BaseListener<OrderCreatedMessage> {
  exchangeName: ExchangeTypes.OrderService = ExchangeTypes.OrderService;
  routingKey: RoutingKeyTypes.OrderCreated = RoutingKeyTypes.OrderCreated;

  async onMessage(data: OrderCreatedMessage['data'], channel: Channel, msg: ConsumeMessage) {
    try {
      const productIds = data.items.map((item) => item.productId);

      if (!productIds.length) {
        console.log(`Order ${data.orderId} carried no items — nothing to clear`);
        channel.ack(msg);
        return;
      }

      const cartRepository = dbClient.getRepository(Cart);

      // find + remove rather than repository.delete(): the match is on the
      // `product` relation, and remove() runs the entity lifecycle TypeORM
      // expects for a versioned entity.
      const carts = await cartRepository.find({
        where: {
          userId: data.userId,
          product: { id: In(productIds) },
        },
        relations: ['product'],
      });

      if (!carts.length) {
        console.log(`No cart rows to clear for order ${data.orderId}`);
        channel.ack(msg);
        return;
      }

      await cartRepository.remove(carts);
      console.log(`Cleared ${carts.length} cart row(s) for order ${data.orderId}`);
      channel.ack(msg);
    } catch (error: any) {
      // Never leave the message unacked: BaseListener sets prefetch(1), so one
      // stuck delivery blocks every later order-created event. Requeue once is
      // not safe either (it would spin), so we drop it and log loudly.
      console.error(`Failed clearing cart for order ${data?.orderId}:`, error.message);
      channel.nack(msg, false, false);
    }
  }
}
