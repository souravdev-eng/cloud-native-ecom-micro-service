import { Channel } from 'amqplib';
import { ExchangeTypes } from '../types/subjects';

interface Event {
  exchange: ExchangeTypes;
  data: any;
}

export abstract class BasePublisher<T extends Event> {
  protected channel: Channel;
  abstract exchangeName: T['exchange'];
  abstract routingKey: string;

  constructor(channel: Channel) {
    this.channel = channel;
  }

  async publish(data: T['data']) {
    await this.channel.assertExchange(this.exchangeName, 'direct');
    this.channel.publish(this.exchangeName, this.routingKey, Buffer.from(data));
    console.log(`Message published Exchange:${this.exchangeName} / RoutingKey: ${this.routingKey}`);
  }
}
