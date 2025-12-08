import { Router, Request, Response } from 'express';
import { requireAuth, restrictTo } from '@ecom-micro/common';
import { CronScheduler } from '../scheduler/cronJobs';
// import { logger } from '@ecom-micro/common';

const router = Router();

// Get scheduler status
router.get(
    '/api/etl/scheduler/status',
    requireAuth,
    restrictTo('admin'),
    (req: Request, res: Response) => {
        try {
            const status = CronScheduler.getStatus();
            res.status(200).json({
                success: true,
                status,
                timestamp: new Date(),
            });
        } catch (error: any) {
            console.error('Failed to get scheduler status:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to get scheduler status',
                error: error.message,
            });
        }
    }
);

// Start sync scheduler
router.post(
    '/api/etl/scheduler/start',
    requireAuth,
    restrictTo('admin'),
    (req: Request, res: Response) => {
        try {
            CronScheduler.startSync();
            console.log(`Scheduler started by user ${req.user?.id}`);

            res.status(200).json({
                success: true,
                message: 'Sync scheduler started',
                timestamp: new Date(),
            });
        } catch (error: any) {
            console.error('Failed to start scheduler:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to start scheduler',
                error: error.message,
            });
        }
    }
);

// Stop sync scheduler
router.post(
    '/api/etl/scheduler/stop',
    requireAuth,
    restrictTo('admin'),
    (req: Request, res: Response) => {
        try {
            CronScheduler.stopSync();
            console.log(`Scheduler stopped by user ${req.user?.id}`);

            res.status(200).json({
                success: true,
                message: 'Sync scheduler stopped',
                timestamp: new Date(),
            });
        } catch (error: any) {
            console.error('Failed to stop scheduler:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to stop scheduler',
                error: error.message,
            });
        }
    }
);

// Trigger manual sync via scheduler
router.post(
    '/api/etl/scheduler/trigger',
    requireAuth,
    restrictTo('admin'),
    async (req: Request, res: Response) => {
        try {
            console.log(`Manual sync triggered via scheduler by user ${req.user?.id}`);

            // Start the sync asynchronously
            CronScheduler.triggerManualSync().catch(error => {
                console.error('Manual sync via scheduler failed:', error.message);
            });

            res.status(202).json({
                success: true,
                message: 'Manual sync triggered successfully',
                timestamp: new Date(),
            });
        } catch (error: any) {
            console.error('Failed to trigger manual sync:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to trigger manual sync',
                error: error.message,
            });
        }
    }
);

export { router as schedulerRoutes };
