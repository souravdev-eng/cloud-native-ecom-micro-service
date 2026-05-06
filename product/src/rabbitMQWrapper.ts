import amqp, { Channel } from "amqplib";

class RabbitMQWrapper {
  private _channel?: Channel;
  private _connection?: any;

  get channel() {
    if (!this._channel) {
      throw new Error("Cannot access RabbitMQ channel before connecting");
    }
    return this._channel;
  }
  async connect(url: string) {
    try {
      this._connection = await amqp.connect(url);
      this._channel = await this._connection.createChannel();
      console.log("RabbitMQ server connected");
    } catch (error) {
      console.log("Not able to connect RabbitMQ server!");
      process.exit(1);
    }
  }

  async close() {
    if (this._connection) {
      await this._connection.close();
      console.log("RabbitMQ connection closed");
    }
  }
}

export const rabbitMQWrapper = new RabbitMQWrapper();
