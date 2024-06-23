import { Channel } from 'amqplib';
import { ExchangeTypes } from '../types/exchange.types';
import { RoutingKeyTypes } from '../types/routingKey.types';
interface Event {
    exchangeName: ExchangeTypes;
    data: any;
}
export declare abstract class BasePublisher<T extends Event> {
    protected channel: Channel;
    abstract exchangeName: T['exchangeName'];
    abstract routingKey: RoutingKeyTypes;
    constructor(channel: Channel);
    publish(data: T['data']): Promise<void>;
}
export {};
