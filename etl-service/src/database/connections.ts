import mongoose from 'mongoose';
import { DataSource } from 'typeorm';
import { Product as CartProduct } from '../entities/CartProduct';
import { Cart } from '../entities/Cart';

export class DatabaseConnections {
    private static mongoConnection: mongoose.Connection;
    private static orderMongoConnection: mongoose.Connection;
    private static postgresConnection: DataSource;

    static async initialize() {
        await this.connectProductMongoDB();
        await this.connectOrderMongoDB();
        await this.connectPostgreSQL();
    }

    /**
     * Connect to Product Service MongoDB (source for product sync)
     */
    private static async connectProductMongoDB() {
        try {
            mongoose.set('strictQuery', false);
            await mongoose.connect(process.env.PRODUCT_SERVICE_MONGODB_URL!, {
                user: process.env.MONGO_USER,
                pass: process.env.MONGO_PASSWORD,
            });

            this.mongoConnection = mongoose.connection;
            console.log('ETL: Product Service MongoDB connected');
        } catch (error: any) {
            console.error('Product MongoDB connection error:', error.message);
            throw error;
        }
    }

    /**
     * Connect to Order Service MongoDB (target for cart sync)
     */
    private static async connectOrderMongoDB() {
        try {
            // Create a separate connection for Order Service
            const orderMongoUrl = process.env.ORDER_SERVICE_MONGODB_URL;
            if (!orderMongoUrl) {
                console.warn('ORDER_SERVICE_MONGODB_URL not set, using default connection for order service');
                this.orderMongoConnection = this.mongoConnection;
                return;
            }

            const orderConnection = await mongoose.createConnection(orderMongoUrl, {
                user: process.env.MONGO_USER,
                pass: process.env.MONGO_PASSWORD,
            }).asPromise();

            this.orderMongoConnection = orderConnection;
            console.log('ETL: Order Service MongoDB connected');
        } catch (error: any) {
            console.error('Order MongoDB connection error:', error.message);
            // Fallback to main connection if order-specific connection fails
            this.orderMongoConnection = this.mongoConnection;
            console.warn('ETL: Using Product MongoDB for Order Service (fallback)');
        }
    }

    /**
     * Connect to Cart Service PostgreSQL (source for cart sync)
     */
    private static async connectPostgreSQL() {
        try {
            this.postgresConnection = new DataSource({
                type: 'postgres',
                port: 5432,
                url: process.env.CART_DB_URL,
                entities: [CartProduct, Cart],
                synchronize: false, // Don't auto-sync schema in ETL service
                logging: process.env.NODE_ENV === 'development',
            });

            await this.postgresConnection.initialize();
            console.log('ETL: Cart Service PostgreSQL connected');
        } catch (error: any) {
            console.error('PostgreSQL connection error:', error.message);
            throw error;
        }
    }

    static getMongoConnection() {
        if (!this.mongoConnection) {
            throw new Error('MongoDB connection not initialized');
        }
        return this.mongoConnection;
    }

    static getOrderMongoConnection() {
        if (!this.orderMongoConnection) {
            throw new Error('Order MongoDB connection not initialized');
        }
        return this.orderMongoConnection;
    }

    static getPostgresConnection() {
        if (!this.postgresConnection) {
            throw new Error('PostgreSQL connection not initialized');
        }
        return this.postgresConnection;
    }

    static async close() {
        try {
            if (this.mongoConnection) {
                await mongoose.connection.close();
                console.log('Product MongoDB connection closed');
            }

            if (this.orderMongoConnection && this.orderMongoConnection !== this.mongoConnection) {
                await this.orderMongoConnection.close();
                console.log('Order MongoDB connection closed');
            }

            if (this.postgresConnection && this.postgresConnection.isInitialized) {
                await this.postgresConnection.destroy();
                console.log('PostgreSQL connection closed');
            }
        } catch (error: any) {
            console.error('Error closing database connections:', error.message);
        }
    }

    static async testConnections() {
        const status = { productMongodb: false, orderMongodb: false, postgresql: false };

        try {
            // Test Product MongoDB
            await mongoose.connection.db.admin().ping();
            status.productMongodb = true;
        } catch (e: any) {
            console.error('Product MongoDB test failed:', e.message);
        }

        try {
            // Test Order MongoDB
            if (this.orderMongoConnection) {
                await this.orderMongoConnection.db.admin().ping();
                status.orderMongodb = true;
            }
        } catch (e: any) {
            console.error('Order MongoDB test failed:', e.message);
        }

        try {
            // Test PostgreSQL
            await this.postgresConnection.query('SELECT 1');
            status.postgresql = true;
        } catch (e: any) {
            console.error('PostgreSQL test failed:', e.message);
        }

        return status;
    }
}
