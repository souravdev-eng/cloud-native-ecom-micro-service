import { Channel, ConsumeMessage } from 'amqplib';
import { queueConnection } from './connection';
import { sendResetTokenEmail } from '../service/sendEmail';

export const consumeAuthEmailMessage = async (channel: Channel) => {
  try {
    if (!channel) {
      channel = (await queueConnection.createConnection()) as Channel;
    }
    const exchangeName = 'ecom-email-notification';
    const routingKey = 'auth-email';
    const queueName = 'auth-email-queue';

    await channel.assertExchange(exchangeName, 'direct');

    const ecomQueue = await channel.assertQueue(queueName, { durable: true, autoDelete: false });
    await channel.bindQueue(ecomQueue.queue, exchangeName, routingKey);

    channel.consume(ecomQueue.queue, async (msg: ConsumeMessage | null) => {
      const { receiverEmail, emailTopic, emailData } = JSON.parse(msg!.content.toString());
      await sendResetTokenEmail(receiverEmail, emailTopic, emailData);
      channel.ack(msg!);
    });
  } catch (error) {
    console.log('Error while consume auth email', error);
  }
};
