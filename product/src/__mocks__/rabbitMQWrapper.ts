export const rabbitMQWrapper = {
    channel: {
        assertExchange: jest.fn().mockResolvedValue(undefined),
        publish: jest.fn().mockReturnValue(true),
        assertQueue: jest.fn().mockResolvedValue({ queue: 'test-queue' }),
        bindQueue: jest.fn().mockResolvedValue(undefined),
        consume: jest.fn().mockResolvedValue(undefined),
        ack: jest.fn(),
        nack: jest.fn(),
        sendToQueue: jest.fn().mockReturnValue(true),
    },
    connect: jest.fn().mockResolvedValue(undefined),
};

