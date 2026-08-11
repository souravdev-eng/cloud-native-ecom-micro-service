import {
  BaseListener,
  ExchangeTypes,
  ProductUpdatedMessage,
  RoutingKeyTypes,
} from "@ecom-micro/common";
import { Channel, ConsumeMessage } from "amqplib";
import { db } from "../../db";
import { products } from "../../models";

/**
 * Keeps the local `products` replica in sync when a product is UPDATED.
 *
 * We upsert (not just update): if this service started AFTER the product was
 * created — so we never saw the "created" event — an "updated" event still
 * populates the row. This makes the replica self-healing.
 */
export class ProductUpdatedListener extends BaseListener<ProductUpdatedMessage> {
  exchangeName: ExchangeTypes.ProductService = ExchangeTypes.ProductService;
  routingKey: RoutingKeyTypes.ProductUpdated = RoutingKeyTypes.ProductUpdated;

  async onMessage(
    data: ProductUpdatedMessage["data"],
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

      await db
        .insert(products)
        .values(row)
        .onConflictDoUpdate({
          target: products.productId,
          set: { ...row, syncedAt: new Date() },
        });

      channel.ack(msg);
    } catch (err) {
      console.error("ProductUpdatedListener error:", err);
      channel.nack(msg, false, false);
    }
  }
}
