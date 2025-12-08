import app from './app';
import { DatabaseConnections } from './database/connections';
import { CronScheduler } from './scheduler/cronJobs';
// import { logger } from '@ecom-micro/common';

const start = async () => {
    // Environment validation
    if (!process.env.PRODUCT_SERVICE_MONGODB_URL) {
        throw new Error('PRODUCT_SERVICE_MONGODB_URL must be defined');
    }

    if (!process.env.CART_DB_URL) {
        throw new Error('CART_DB_URL must be defined');
    }

    if (!process.env.MONGO_USER) {
        throw new Error('MONGO_USER must be defined');
    }

    if (!process.env.MONGO_PASSWORD) {
        throw new Error('MONGO_PASSWORD must be defined');
    }

    if (!process.env.JWT_KEY) {
        throw new Error('JWT_KEY must be defined');
    }

    try {
        // Initialize database connections
        await DatabaseConnections.initialize();
        console.log('ETL Service database connections established');

        // Initialize cron scheduler
        CronScheduler.initialize();
        console.log('ETL Service scheduler initialized');


    } catch (error: any) {
        console.error('ETL Service startup error:', error.message);
        process.exit(1);
    }
    // Start the server
    const port = process.env.PORT || 4000;
    app.listen(port, () => {
        console.log(`ETL Service running on PORT ${port}`);
    });
};

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await DatabaseConnections.close();
    CronScheduler.destroy();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    await DatabaseConnections.close();
    CronScheduler.destroy();
    process.exit(0);
});

start();
