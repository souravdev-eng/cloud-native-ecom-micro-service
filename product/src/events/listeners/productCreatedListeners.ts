import { Subjects, ProductCreatedEvent, Listener } from '@ecom-micro/common';
import { Message } from 'node-nats-streaming';
import { queueGroupName } from '../queueName';

export class ProductCreatedListener extends Listener<ProductCreatedEvent> {
  subject: Subjects.ProductCreated = Subjects.ProductCreated;
  queueGroupName = queueGroupName;

  async onMessage(data: ProductCreatedEvent['data'], msg: Message) {
    console.log(data);

    msg.ack();
  }
}
