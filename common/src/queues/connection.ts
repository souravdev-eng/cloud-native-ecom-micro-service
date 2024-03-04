import client, { Channel, Connection } from "amqplib";

export class QueueConnection {
    private connection: Connection | undefined;
    private channel: Channel | undefined;

    constructor(private readonly endPoint: string) {
        this.connection = undefined;
        this.channel = undefined;
    }

    async createConnection(): Promise<Channel | undefined> {
        try {
            this.connection = await client.connect(this.endPoint);
            this.channel = await this.connection.createChannel();
            this.closeConnection();
            console.log('Notification server connected to queue successfully...')
            return this.channel;
        } catch (error) {
            console.log('error', 'NotificationService error createConnection() method:', error);
            return undefined;
        }
    }

    private closeConnection(): void {
        process.once('SIGINT', async () => {
            if (this.connection) {
                await this.connection?.close()
            }

            if (this.channel) {
                await this.channel?.close()
            }
        })
    }
}

