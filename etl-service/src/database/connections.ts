import mongoose from 'mongoose';
import { DataSource } from 'typeorm';
// import { logger } from '@ecom-micro/common';
import { Product as CartProduct } from '../entities/CartProduct';

export class DatabaseConnections {
    private static mongoConnection: mongoose.Connection;
    private static postgresConnection: DataSource;

    static async initialize() {
        await this.connectMongoDB();
        await this.connectPostgreSQL();
    }

    private static async connectMongoDB() {
        try {
            mongoose.set('strictQuery', false);
            await mongoose.connect(process.env.PRODUCT_SERVICE_MONGODB_URL!, {
                user: process.env.MONGO_USER,
                pass: process.env.MONGO_PASSWORD,
            });

            this.mongoConnection = mongoose.connection;
            console.log('ETL Service MongoDB connection established');
        } catch (error: any) {
            console.error('MongoDB connection error:', error.message);
            throw error;
        }
    }

    private static async connectPostgreSQL() {
        try {
            this.postgresConnection = new DataSource({
                type: 'postgres',
                port: 5432,
                url: process.env.CART_DB_URL,
                entities: [CartProduct],
                synchronize: false, // Don't auto-sync schema in ETL service
                logging: process.env.NODE_ENV === 'development',
            });

            await this.postgresConnection.initialize();
            console.log('ETL Service PostgreSQL connection established');
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
                console.log('MongoDB connection closed');
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
        try {
            // Test MongoDB
            await mongoose.connection.db.admin().ping();

            // Test PostgreSQL
            await this.postgresConnection.query('SELECT 1');

            return { mongodb: true, postgresql: true };
        } catch (error: any) {
            console.error('Database connection test failed:', error.message);
            throw error;
        }
    }
}
