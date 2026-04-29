import amqp, { Channel, Connection } from 'amqplib';

class RabbitMQWrapper {
  private _channel?: Channel;
  private _connection?: Connection;

  get channel() {
    if (!this._channel) {
      throw new Error('Cannot access MQ channel before connecting');
    }
    return this._channel;
  }

  async connect(url: string) {
    const connection = await amqp.connect(url);
    this._connection = connection;
    this._channel = await connection.createChannel();
    console.log('MQ Server connected...');
  }

  async close() {
    await this._channel?.close();
    await this._connection?.close();
  }
}

export const rabbitMQWrapper = new RabbitMQWrapper();
