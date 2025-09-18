import amqp, { Channel } from 'amqplib';

class RabbitMQWrapper {
  private _channel?: Channel;

  get channel() {
    if (!this._channel) {
      throw new Error('Cannot access MQ channel before connecting');
    }
    return this._channel;
  }
  async connect(url: string) {
    try {
      const connection = await amqp.connect(url);
      this._channel = await connection.createChannel();
      console.log('MQ Server connected ~~ 🐰');
    } catch (error) {
      console.log('Not able to connect MQ server!');
      process.exit(1);
    }
  }
}

export const rabbitMQWrapper = new RabbitMQWrapper();
