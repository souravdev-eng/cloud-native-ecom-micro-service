import { Channel } from 'amqplib';
import { ExchangeTypes } from '../types/subjects';
interface Event {
    exchange: ExchangeTypes;
    data: any;
}
export declare abstract class BasePublisher<T extends Event> {
    protected channel: Channel;
    abstract exchangeName: T['exchange'];
    abstract routingKey: string;
    constructor(channel: Channel);
    publish(data: T['data']): Promise<void>;
}
export {};
