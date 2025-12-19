import { DataSource } from 'typeorm';
import { newDb, DataType } from 'pg-mem';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { Cart } from '../entity/Cart';
import { Product } from '../entity/Product';

// Polyfill for ReadableStream (required by undici/elasticsearch in @ecom-micro/common)
import { ReadableStream, TransformStream, WritableStream } from 'stream/web';
Object.assign(globalThis, { ReadableStream, TransformStream, WritableStream });

// Mock the RabbitMQ wrapper to prevent actual connections during tests
jest.mock('../rabbitMQWrapper', () => ({
    rabbitMQWrapper: {
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
    },
}));

declare global {
    function signIn(userId?: string): string[];
    function createTestProduct(data?: Partial<{
        id: string;
        title: string;
        price: number;
        image: string;
        sellerId: string;
        quantity: number;
    }>): Promise<Product>;
    var testDataSource: DataSource;
}

let dataSource: DataSource;

beforeAll(async () => {
    process.env.JWT_KEY = 'test-jwt-secret';
    process.env.NODE_ENV = 'test';

    // Create in-memory PostgreSQL database using pg-mem
    const db = newDb();

    // Register required PostgreSQL functions that pg-mem doesn't support by default
    db.public.registerFunction({
        name: 'current_database',
        implementation: () => 'test_db',
    });

    db.public.registerFunction({
        name: 'version',
        implementation: () => 'PostgreSQL 14.0 (pg-mem)',
    });

    // Required by TypeORM for schema synchronization
    db.public.registerFunction({
        name: 'obj_description',
        args: [DataType.regclass, DataType.text],
        returns: DataType.text,
        implementation: () => null,
    });

    db.public.registerFunction({
        name: 'col_description',
        args: [DataType.regclass, DataType.integer],
        returns: DataType.text,
        implementation: () => null,
    });

    // Required for UUID generation in TypeORM
    // impure: true tells pg-mem not to cache the result (each call generates new UUID)
    db.public.registerFunction({
        name: 'uuid_generate_v4',
        returns: DataType.uuid,
        implementation: () => uuidv4(),
        impure: true,
    });

    // Create TypeORM DataSource from pg-mem
    dataSource = await db.adapters.createTypeormDataSource({
        type: 'postgres',
        entities: [Cart, Product],
        synchronize: true,
    });

    await dataSource.initialize();

    // Make dataSource globally available
    global.testDataSource = dataSource;
}, 30000);

beforeEach(async () => {
    jest.clearAllMocks();

    // Clear tables in correct order (child tables first due to foreign key constraints)
    // Cart references Product, so clear Cart first
    await dataSource.createQueryBuilder().delete().from(Cart).execute();
    await dataSource.createQueryBuilder().delete().from(Product).execute();
});

afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
        await dataSource.destroy();
    }
});

// Global helper to sign in a user
global.signIn = (userId?: string) => {
    const payload = {
        id: userId || 'test-user-id-123',
        email: 'test@test.com',
    };

    const token = jwt.sign(payload, process.env.JWT_KEY!);
    const session = { jwt: token };
    const sessionJSON = JSON.stringify(session);
    const base64 = Buffer.from(sessionJSON).toString('base64');

    return [`session=${base64}`];
};

// Global helper to create a test product
global.createTestProduct = async (data?: Partial<{
    id: string;
    title: string;
    price: number;
    image: string;
    sellerId: string;
    quantity: number;
}>) => {
    const product = Product.create({
        id: data?.id ?? 'test-product-id-123',
        title: data?.title ?? 'Test Product',
        price: data?.price ?? 150,
        image: data?.image ?? 'http://test.png',
        sellerId: data?.sellerId ?? 'test-seller-id',
        quantity: data?.quantity ?? 10,  // Use ?? to allow quantity: 0
    });

    return await product.save();
};

