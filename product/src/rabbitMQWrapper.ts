import amqp, { Channel } from "amqplib";

class RabbitMQWrapper {
  private _channel?: Channel;

  get channel() {
    if (!this._channel) {
      throw new Error("Cannot access RabbitMQ channel before connecting");
    }
    return this._channel;
  }
  async connect(url: string) {
    try {
      const connection = await amqp.connect(url);
      this._channel = await connection.createChannel();
      console.log("RabbitMQ server connected");
    } catch (error) {
      console.log("Not able to connect RabbitMQ server!");
      process.exit(1);
    }
  }
}

export const rabbitMQWrapper = new RabbitMQWrapper();
