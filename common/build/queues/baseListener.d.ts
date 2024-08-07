import { Channel, ConsumeMessage } from 'amqplib';
import { ExchangeTypes } from '../types/exchange.types';
import { RoutingKeyTypes } from '../types/routingKey.types';
interface Event {
    exchangeName: ExchangeTypes;
    data: any;
}
export declare abstract class BaseListener<T extends Event> {
    protected channel: Channel;
    abstract exchangeName: T['exchangeName'];
    abstract routingKey: RoutingKeyTypes;
    abstract onMessage(data: T['data'], channel: Channel, msg: ConsumeMessage): void;
    constructor(channel: Channel);
    listen(): Promise<void>;
}
export {};
