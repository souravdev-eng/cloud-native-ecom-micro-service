import { Channel } from 'amqplib';
import { ExchangeTypes } from '../types/exchange.types';
import { RoutingKeyTypes } from '../types/routingKey.types';

interface Event {
  exchangeName: ExchangeTypes;
  data: any;
}

export abstract class BasePublisher<T extends Event> {
  protected channel: Channel;
  abstract exchangeName: T['exchangeName'];
  abstract routingKey: RoutingKeyTypes;

  constructor(channel: Channel) {
    this.channel = channel;
  }

  async publish(data: T['data']) {
    await this.channel.assertExchange(this.exchangeName, 'direct', {
      durable: true,
    });
    this.channel.publish(this.exchangeName, this.routingKey, Buffer.from(JSON.stringify(data)), {
      persistent: true,
    });
    console.log(`Message published Exchange:${this.exchangeName} / RoutingKey: ${this.routingKey}`);
  }
}
