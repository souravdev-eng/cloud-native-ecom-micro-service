import {
  BaseListener,
  ExchangeTypes,
  ProductQuantityUpdatedMessage,
  RoutingKeyTypes,
} from "@ecom-micro/common";
import { eq } from "drizzle-orm";
import { Channel, ConsumeMessage } from "amqplib";
import { db } from "../../db";
import { products } from "../../models";

/**
 * Handles the lighter-weight "quantity changed" event (e.g. after a sale) and
 * updates just the availability column on the replica — no full product resync.
 */
export class ProductQuantityUpdateListener extends BaseListener<ProductQuantityUpdatedMessage> {
  exchangeName: ExchangeTypes.ProductService = ExchangeTypes.ProductService;
  routingKey: RoutingKeyTypes.ProductQuantityUpdated =
    RoutingKeyTypes.ProductQuantityUpdated;

  async onMessage(
    data: ProductQuantityUpdatedMessage["data"],
    channel: Channel,
    msg: ConsumeMessage,
  ) {
    try {
      // db.update(table).set({...}).where(...). $onUpdate fills syncedAt here.
      // If the row isn't in the replica yet this updates 0 rows (safe no-op);
      // a later created/updated event will backfill it.
      await db
        .update(products)
        .set({ quantity: data.quantity })
        .where(eq(products.productId, data.id));

      channel.ack(msg);
    } catch (err) {
      console.error("ProductQuantityUpdateListener error:", err);
      channel.nack(msg, false, false);
    }
  }
}
