import { Channel } from 'amqplib';
import mongoose from 'mongoose';

import { queueConnection } from './queue/connection';
import { config } from './config';
import app from './app';

export let authChannel: Channel;

const start = async () => {
    if (!config.AUTH_SERVICE_MONGODB_URL) {
        throw new Error('DB url not found');
    }

    if (!config.AUTH_SERVICE_MONGODB_USER) {
        throw new Error('DB user not found');
    }

    if (!config.AUTH_SERVICE_MONGODB_PASSWORD) {
        throw new Error('DB password not found');
    }

    connectDB();
    startQueues();

    app.listen(3000, () =>
        console.log(`Auth service running on PORT 3000....`)
    );
};

const connectDB = async () => {
    mongoose
        .connect(config.AUTH_SERVICE_MONGODB_URL!, {
            user: config.AUTH_SERVICE_MONGODB_USER!,
            pass: config.AUTH_SERVICE_MONGODB_PASSWORD!,
            auth: {
                username: config.AUTH_SERVICE_MONGODB_USER!,
                password: config.AUTH_SERVICE_MONGODB_PASSWORD!,
            },
        })
        .then(() => {
            console.log('Auth Service MongoDB connected successfully.🚀🚀');
        })
        .catch((error) => {
            console.log('💥 DB Error: ', error);
        });
};

const startQueues = async (): Promise<void> => {
    authChannel = (await queueConnection.createConnection()) as Channel;
};

start();
