import {
  BaseListener,
  ExchangeTypes,
  ProductCreatedMessage,
  RoutingKeyTypes,
} from "@ecom-micro/common";
import { Channel, ConsumeMessage } from "amqplib";
import { db } from "../../db";
import { products } from "../../models";

/**
 * Keeps the local `products` replica in sync when a product is CREATED.
 *
 * BaseListener (from @ecom-micro/common) does the AMQP plumbing: it asserts the
 * exchange, binds a durable queue to `routingKey`, sets prefetch(1), and calls
 * onMessage() for each delivery. We only declare which exchange/key to bind and
 * what to do with the payload — then we MUST ack (or nack) the message.
 */
export class ProductCreatedListener extends BaseListener<ProductCreatedMessage> {
  exchangeName: ExchangeTypes.ProductService = ExchangeTypes.ProductService;
  routingKey: RoutingKeyTypes.ProductCreated = RoutingKeyTypes.ProductCreated;

  async onMessage(
    data: ProductCreatedMessage["data"],
    channel: Channel,
    msg: ConsumeMessage,
  ) {
    try {
      const row = {
        productId: data.id,
        title: data.title,
        price: data.price,
        originalPrice: data.originalPrice,
        image: data.image,
        sellerId: data.sellerId,
        category: data.category,
        quantity: data.quantity,
        stockQuantity: data.stockQuantity,
        tags: data.tags ?? [],
      };

      // UPSERT. Using onConflictDoUpdate (instead of a plain insert) makes the
      // handler idempotent: if RabbitMQ redelivers the same "created" message,
      // or a "created" arrives after we already saw an "updated", we converge
      // to the latest state instead of throwing a duplicate-key error.
      await db
        .insert(products)
        .values(row)
        .onConflictDoUpdate({
          target: products.productId, // the unique/PK column that conflicts
          set: { ...row, syncedAt: new Date() }, // columns to overwrite on conflict
        });

      channel.ack(msg);
    } catch (err) {
      console.error("ProductCreatedListener error:", err);
      // nack(msg, allUpTo=false, requeue=false): drop the poison message rather
      // than requeue it forever. Wire a dead-letter exchange later if needed.
      channel.nack(msg, false, false);
    }
  }
}
