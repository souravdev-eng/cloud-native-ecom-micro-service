import { Channel, ConsumeMessage } from 'amqplib';
import { ExchangeTypes } from '../types/exchange.types';
import { RoutingKeyTypes } from '../types/routingKey.types';
interface Event {
    exchange: ExchangeTypes;
    data: any;
}
export declare abstract class BaseListener<T extends Event> {
    protected channel: Channel;
    abstract exchangeName: T['exchange'];
    abstract routingKey: RoutingKeyTypes;
    abstract onMessage(data: T['data'], msg: ConsumeMessage): void;
    constructor(channel: Channel);
    listen(): Promise<void>;
}
export {};
