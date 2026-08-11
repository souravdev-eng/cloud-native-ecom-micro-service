import {
  BaseListener,
  ExchangeTypes,
  ProductDeletedMessage,
  RoutingKeyTypes,
} from "@ecom-micro/common";
import { eq } from "drizzle-orm";
import { Channel, ConsumeMessage } from "amqplib";
import { db } from "../../db";
import { products } from "../../models";

/**
 * Removes a product from the local replica when it is DELETED upstream.
 *
 * NOTE: this only touches the `products` replica. It does NOT cascade into
 * order_items — those keep their snapshot on purpose (see models/orderItem.ts),
 * so past
 * orders still show what was bought even after the product is gone.
 */
export class ProductDeleteListener extends BaseListener<ProductDeletedMessage> {
  exchangeName: ExchangeTypes.ProductService = ExchangeTypes.ProductService;
  routingKey: RoutingKeyTypes.ProductDeleted = RoutingKeyTypes.ProductDeleted;

  async onMessage(
    data: ProductDeletedMessage["data"],
    channel: Channel,
    msg: ConsumeMessage,
  ) {
    try {
      // db.delete(table).where(condition).
      // eq(column, value) builds the SQL `product_id = $1` predicate.
      // Deleting a non-existent row is a no-op, so this is naturally idempotent.
      await db.delete(products).where(eq(products.productId, data.id));

      channel.ack(msg);
    } catch (err) {
      console.error("ProductDeleteListener error:", err);
      channel.nack(msg, false, false);
    }
  }
}
