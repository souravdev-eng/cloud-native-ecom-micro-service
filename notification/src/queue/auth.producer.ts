import { Channel } from "amqplib";
import { queueConnection } from "./connection";

export const publishDirectMessage = async (
    channel: Channel,
    exchangeName: string,
    routingKey: string,
    message: string,
    logMessage: string
): Promise<void> => {
    try {
        if (!channel) {
            channel = await queueConnection.createConnection() as Channel;
        }

        await channel.assertExchange(exchangeName, 'direct');
        channel.publish(exchangeName, routingKey, Buffer.from(message));
        console.log(logMessage);
    } catch (error) {
        console.log('AuthService Provider publishDirectMessage() method error:', error);
    }
}