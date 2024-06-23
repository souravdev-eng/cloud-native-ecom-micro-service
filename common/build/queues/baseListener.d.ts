import { Channel, ConsumeMessage } from 'amqplib';
import { ExchangeTypes } from '../types/subjects';
interface Event {
    exchange: ExchangeTypes;
    data: any;
}
export declare abstract class BaseListener<T extends Event> {
    protected channel: Channel;
    abstract exchangeName: T['exchange'];
    abstract routingKey: string;
    abstract onMessage(data: T['data'], msg: ConsumeMessage): void;
    constructor(channel: Channel);
    listen(): Promise<void>;
}
export {};
