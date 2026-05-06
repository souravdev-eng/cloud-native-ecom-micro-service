import { Channel } from 'amqplib';

// Shared channel state - exported separately to avoid circular imports
export let authChannel: Channel | null = null;

export const setAuthChannel = (channel: Channel): void => {
    authChannel = channel;
};

