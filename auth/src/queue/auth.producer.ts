import { Channel } from 'amqplib';
import { queueConnection } from './connection';
import { authChannel } from '..';

export const publishDirectMessage = async (message: string, logMessage: string): Promise<void> => {
  let channel = authChannel;
  let exchangeName = 'ecom-email-notification';
  let routingKey = 'auth-email';

  try {
    if (!channel) {
      channel = (await queueConnection.createConnection()) as Channel;
    }

    await channel.assertExchange(exchangeName, 'direct');
    channel.publish(exchangeName, routingKey, Buffer.from(message), {
      persistent: true,
    });
    console.log(logMessage);
  } catch (error) {
    console.log('AuthService Provider publishDirectMessage() method error:', error);
  }
};
