import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Mock the queue modules to prevent RabbitMQ connections during tests
jest.mock('../queue/connection', () => ({
    queueConnection: {
        createConnection: jest.fn().mockResolvedValue(null),
    },
}));

jest.mock('../queue/auth.producer', () => ({
    publishDirectMessage: jest.fn().mockResolvedValue(undefined),
}));

declare global {
    function signIn(): string[];
    function sellerSignIn(): any;
}

let mongo: MongoMemoryServer;

beforeAll(async () => {
    process.env.JWT_KEY = 'asdfasdf';
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    process.env.JWT_EXP = '90d';

    mongo = await MongoMemoryServer.create();
    const mongoUri = mongo.getUri();

    await mongoose.connect(mongoUri);
}, 120000); // 2 minutes timeout for MongoDB binary download on first run

beforeEach(async () => {
    jest.clearAllMocks();
    const db = mongoose.connection.db;
    if (db) {
        const collections = await db.collections();
        for (let collection of collections) {
            await collection.deleteMany({});
        }
    }
});

afterAll(async () => {
    await mongoose.disconnect();
    if (mongo) {
        await mongo.stop({ doCleanup: true });
    }
});

global.signIn = () => {
    // Build a JWT payload.  { id, email }
    const payload = {
        id: uuidv4(),
        email: 'test@test.com',
    };

    // Create the JWT!
    const token = jwt.sign(payload, process.env.JWT_KEY!);

    // Build session Object. { jwt: MY_JWT }
    const session = { jwt: token };

    // Turn that session into JSON
    const sessionJSON = JSON.stringify(session);
    // Take JSON and encode it as base64
    const base64 = Buffer.from(sessionJSON).toString('base64');

    // return a string thats the cookie with the encoded data
    return [`session=${base64}`];
};

global.sellerSignIn = () => {
    // Build a JWT payload.  { id, email }
    const payload = {
        id: uuidv4(),
        email: 'seller@test.com',
        role: 'seller',
    };

    // Create the JWT!
    const token = jwt.sign(payload, process.env.JWT_KEY!);

    // Build session Object. { jwt: MY_JWT }
    const session = { jwt: token };

    // Turn that session into JSON
    const sessionJSON = JSON.stringify(session);

    // Take JSON and encode it as base64
    const base64 = Buffer.from(sessionJSON).toString('base64');

    // return a string thats the cookie with the encoded data
    return {
        token: [`session=${base64}`],
        payload,
    };
    // return [`session=${base64}`];
};
