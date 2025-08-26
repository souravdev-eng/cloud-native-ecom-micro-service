import { Channel } from 'amqplib';
import { queueConnection } from './connection';
import { authChannel } from '..';
import { logger } from '../utils/logger';

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

    logger.info('AuthService Provider publishDirectMessage()');
    logger.info(logMessage);
  } catch (error) {
    logger.error('AuthService Provider publishDirectMessage() method error:');
    logger.error(error);
  }
};
