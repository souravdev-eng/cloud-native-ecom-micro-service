import { Router, Request, Response } from 'express';
import { DatabaseConnections } from '../database/connections';
// import { logger } from '@ecom-micro/common';

const router = Router();

// Health check endpoint
router.get('/api/etl/health', async (req: Request, res: Response) => {
    try {
        const connectionStatus = await DatabaseConnections.testConnections();

        const health = {
            status: 'healthy',
            timestamp: new Date(),
            service: 'etl-service',
            version: '1.0.0',
            uptime: process.uptime(),
            connections: connectionStatus,
            memory: {
                used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
                total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
            },
        };

        res.status(200).json(health);
    } catch (error: any) {
        console.error('Health check failed:', error.message);

        const health = {
            status: 'unhealthy',
            timestamp: new Date(),
            service: 'etl-service',
            version: '1.0.0',
            uptime: process.uptime(),
            error: error.message,
            connections: {
                mongodb: false,
                postgresql: false,
            },
        };

        res.status(503).json(health);
    }
});

// Readiness probe endpoint
router.get('/api/etl/ready', async (req: Request, res: Response) => {
    try {
        await DatabaseConnections.testConnections();
        res.status(200).json({
            status: 'ready',
            timestamp: new Date(),
        });
    } catch (error: any) {
        console.error('Readiness check failed:', error.message);
        res.status(503).json({
            status: 'not ready',
            timestamp: new Date(),
            error: error.message,
        });
    }
});

// Liveness probe endpoint
router.get('/api/etl/live', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'alive',
        timestamp: new Date(),
        uptime: process.uptime(),
    });
});

export { router as healthRoutes };
