import { Channel } from 'amqplib';
export declare class QueueConnection {
    private readonly endPoint;
    private connection;
    private channel;
    constructor(endPoint: string);
    createConnection(): Promise<Channel | undefined>;
    private closeConnection;
}
