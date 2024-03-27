import { Channel } from 'amqplib';
import { queueConnection } from './queue/connection';
import { consumeAuthEmailMessage } from './queue/email.consumer';

import app from './app';

const startQueues = async (): Promise<void> => {
  const emailChannel = (await queueConnection.createConnection()) as Channel;
  await consumeAuthEmailMessage(emailChannel);
};

const start = (): void => {
  startQueues();
  app.listen(4000, () => {
    console.log('Notification service running on port 4000');
  });
};

start();
