import { Channel, ConsumeMessage } from 'amqplib';
import { Exchange } from './types/Exchange';
interface Event {
    exchangeName: Exchange;
    data: any;
}
export declare abstract class MQConsumer<T extends Event> {
    abstract exchangeName: T['exchangeName'];
    abstract routingKey: string;
    abstract queueName: string;
    protected channel: Channel;
    abstract onMessage(data: T['data'], msg: ConsumeMessage): void;
    constructor(channel: Channel);
    consume(): Promise<void>;
}
export {};
