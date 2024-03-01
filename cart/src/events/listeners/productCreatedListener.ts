import { Subjects, ProductCreatedEvent, Listener, BadRequestError } from '@ecom-micro/common';
import { Message } from 'node-nats-streaming';
import { Product } from '../../entity/Product';
import { queueGroupName } from '../queueName';

export class ProductCreatedListener extends Listener<ProductCreatedEvent> {
  subject: Subjects.ProductCreated = Subjects.ProductCreated;
  queueGroupName = queueGroupName;

  async onMessage(data: ProductCreatedEvent['data'], msg: Message) {
    try {
      const { id, price, image, sellerId, title } = data;

      const existingProduct = await Product.findOneBy({ id });

      if (existingProduct) {
        throw new BadRequestError('Oops! Product already exist on db');
      }

      const product = Product.create({ id, title, image, sellerId, price });
      await product.save();

      msg.ack();
    } catch (error: any) {
      throw new BadRequestError('Cart product creation failed!');
    }
  }
}
