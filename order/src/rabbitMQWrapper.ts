import amqp, { Channel } from "amqplib";

// Singleton holder for the AMQP connection + channel, shared by every
// listener. Mirrors the wrapper used by the other Node services so the
// connection lifecycle is identical across the system.
class RabbitMQWrapper {
  private _channel?: Channel;
  private _connection?: Awaited<ReturnType<typeof amqp.connect>>;

  get channel() {
    if (!this._channel) {
      throw new Error("Cannot access MQ channel before connecting");
    }
    return this._channel;
  }

  async connect(url: string) {
    const connection = await amqp.connect(url);
    this._connection = connection;
    this._channel = await connection.createChannel();
    console.log("MQ Server connected...");
  }

  async close() {
    await this._channel?.close();
    await this._connection?.close();
  }
}

export const rabbitMQWrapper = new RabbitMQWrapper();
