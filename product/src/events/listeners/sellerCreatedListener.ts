import { Subjects, Listener, SellerCreatedEvent } from '@ecom-micro/common';
import { Message } from 'node-nats-streaming';
import { User } from '../../models/userModel';
import { queueGroupName } from '../queueName';

export class SellerCreatedListener extends Listener<SellerCreatedEvent> {
  subject: Subjects.SellerCreated = Subjects.SellerCreated;
  queueGroupName = queueGroupName;

  async onMessage(data: SellerCreatedEvent['data'], msg: Message) {
    console.log(data);

    const user = User.build({
      id: data.id,
      email: data.email,
      role: data.role,
    });

    await user.save();
    // msg.ack();
  }
}
