import {
    BaseListener,
    ExchangeTypes,
    ProductUpdatedMessage,
    RoutingKeyTypes,
} from '@ecom-micro/common';
import { ConsumeMessage, Channel } from 'amqplib';
import { Product } from '../../entity/Product';

interface ProductType {
    id: string;
    title: string;
    quantity: number;
    price: number;
    image: string;
    sellerId: string;
}
export class ProductUpdatedListener extends BaseListener<ProductUpdatedMessage> {
    exchangeName: ExchangeTypes.ProductService = ExchangeTypes.ProductService;
    routingKey: RoutingKeyTypes.ProductUpdated = RoutingKeyTypes.ProductUpdated;

    async onMessage(data: ProductType, channel: Channel, msg: ConsumeMessage) {
        const product = await Product.findOneBy({ id: data.id });

        if (product) {
            product.title = data.title;
            product.quantity = data.quantity;
            product.price = data.price;
            product.image = data.image;

            await product.save();
            channel.ack(msg);
        }
    }
}
