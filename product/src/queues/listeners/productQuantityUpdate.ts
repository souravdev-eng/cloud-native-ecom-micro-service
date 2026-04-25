import {
  BaseListener,
  ExchangeTypes,
  RoutingKeyTypes,
  ProductQuantityUpdatedMessage,
} from "@ecom-micro/common";
import { Channel, ConsumeMessage } from "amqplib";
import { Product } from "../../models/productModel";
import { cache } from "../../cache/redisCache";

export class ProductQuantityUpdateListener extends BaseListener<ProductQuantityUpdatedMessage> {
  exchangeName: ExchangeTypes.ProductService = ExchangeTypes.ProductService;
  routingKey: RoutingKeyTypes.ProductQuantityUpdated = RoutingKeyTypes.ProductQuantityUpdated;

  async onMessage(
    data: ProductQuantityUpdatedMessage["data"],
    channel: Channel,
    msg: ConsumeMessage,
  ) {
    // Atomic conditional decrement: only succeeds if the document exists
    // AND current quantity >= requested decrement. Filter + update are
    // applied as a single atomic op by MongoDB, which closes the TOCTOU
    // gap present in a read-modify-write loop.
    const updated = await Product.findOneAndUpdate(
      { _id: data.id, quantity: { $gte: data.quantity } },
      { $inc: { quantity: -data.quantity } },
      { new: true },
    );

    if (!updated) {
      // Either the product no longer exists or stock is insufficient.
      // Distinguish the two for observability; in both cases ack and
      // drop — the order has already been committed upstream, so
      // retrying the decrement would not help. A future saga step
      // should publish a compensation event from here.
      const exists = await Product.exists({ _id: data.id });
      if (!exists) {
        console.log(`Product not found for quantity update: ${data.id}`);
      } else {
        console.log(
          `Insufficient stock for quantity update: ${data.id} (requested=${data.quantity})`,
        );
      }
      channel.ack(msg);
      return;
    }

    await cache.del(`product:${data.id}`);
    channel.ack(msg);
  }
}
