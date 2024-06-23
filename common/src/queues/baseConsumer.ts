import { Channel, ConsumeMessage } from 'amqplib';
import { Exchange } from './types/Exchange';

interface Event {
  exchangeName: Exchange;
  data: any;
}

export abstract class MQConsumer<T extends Event> {
  abstract exchangeName: T['exchangeName'];
  abstract routingKey: string;
  abstract queueName: string;
  protected channel: Channel;
  abstract onMessage(data: T['data'], msg: ConsumeMessage): void;

  constructor(channel: Channel) {
    this.channel = channel;
  }

  async consume() {
    this.channel.assertExchange(this.exchangeName, 'direct');
    // `assertQueue` will check if there is a queue exist or not to listen the messages
    // if present then it will not create again
    // if not then it will create a queue with provided name
    const ecomQueue = await this.channel.assertQueue(this.queueName, {
      durable: true,
      autoDelete: false,
    });
    await this.channel.bindQueue(ecomQueue.queue, this.exchangeName, this.routingKey);

    this.channel.consume(ecomQueue.queue, async (msg: ConsumeMessage | null) => {
      console.log(`Message received: ${this.exchangeName} / ${this.queueName}`);

      if (msg) {
        const parsedData = JSON.parse(msg!.content.toString());
        this.onMessage(parsedData, msg);
      }
    });
  }
}
