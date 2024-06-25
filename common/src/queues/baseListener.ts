import { Channel, ConsumeMessage } from 'amqplib';
import { ExchangeTypes } from '../types/exchange.types';
import { RoutingKeyTypes } from '../types/routingKey.types';

interface Event {
  exchangeName: ExchangeTypes;
  data: any;
}

export abstract class BaseListener<T extends Event> {
  protected channel: Channel;
  abstract exchangeName: T['exchangeName'];
  abstract routingKey: RoutingKeyTypes;
  abstract onMessage(data: T['data'], channel: Channel, msg: ConsumeMessage): void;

  constructor(channel: Channel) {
    this.channel = channel;
  }

  async listen() {
    await this.channel.assertExchange(this.exchangeName, 'direct', {
      durable: true,
    });

    const consumeQueue = await this.channel.assertQueue(this.routingKey, {
      durable: true,
    });
    await this.channel.bindQueue(consumeQueue.queue, this.exchangeName, this.routingKey);

    this.channel.consume(consumeQueue.queue, async (msg: ConsumeMessage | null) => {
      console.log(`Message received: ${this.exchangeName} / ${this.routingKey}`);

      if (msg) {
        const parsedData = JSON.parse(msg!.content.toString());
        this.onMessage(parsedData, this.channel, msg);
      }
    });
  }
}
