import { Router, Request, Response } from 'express';
import { requireAuth, restrictTo, BadRequestError } from '@ecom-micro/common';
import { ProductSyncService, SyncOptions } from '../etl/productSync';
// import { logger } from '@ecom-micro/common';

const router = Router();

// Manual sync trigger endpoint
router.post(
    '/api/etl/sync',
    requireAuth,
    restrictTo('admin'),
    async (req: Request, res: Response) => {
        try {
            const { dryRun = false, batchSize = 100 } = req.body;

            if (batchSize < 1 || batchSize > 1000) {
                throw new BadRequestError('Batch size must be between 1 and 1000');
            }

            const options: SyncOptions = {
                dryRun: Boolean(dryRun),
                batchSize: Number(batchSize),
            };

            console.log(`Manual sync triggered by user ${req.user?.id}`, {
                dryRun: options.dryRun,
                batchSize: options.batchSize,
            });

            const result = await ProductSyncService.syncProducts(options);

            res.status(200).json({
                success: true,
                message: dryRun ? 'Dry run completed successfully' : 'Sync completed successfully',
                result,
            });
        } catch (error: any) {
            console.error('Manual sync failed:', error.message);
            res.status(500).json({
                success: false,
                message: 'Sync failed',
                error: error.message,
            });
        }
    }
);

// Sync status and statistics endpoint
router.get(
    '/api/etl/status',
    requireAuth,
    restrictTo('admin'),
    async (req: Request, res: Response) => {
        try {
            const [stats, validation] = await Promise.all([
                ProductSyncService.getStats(),
                ProductSyncService.validateSync(),
            ]);

            res.status(200).json({
                success: true,
                stats,
                validation,
                timestamp: new Date(),
            });
        } catch (error: any) {
            console.error('Failed to get sync status:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to get sync status',
                error: error.message,
            });
        }
    }
);

// Validate sync endpoint
router.get(
    '/api/etl/validate',
    requireAuth,
    restrictTo('admin'),
    async (req: Request, res: Response) => {
        try {
            const validation = await ProductSyncService.validateSync();

            res.status(200).json({
                success: true,
                validation,
                timestamp: new Date(),
            });
        } catch (error: any) {
            console.error('Sync validation failed:', error.message);
            res.status(500).json({
                success: false,
                message: 'Sync validation failed',
                error: error.message,
            });
        }
    }
);

// Get sync statistics only
router.get(
    '/api/etl/stats',
    requireAuth,
    restrictTo('admin'),
    async (req: Request, res: Response) => {
        try {
            const stats = await ProductSyncService.getStats();

            res.status(200).json({
                success: true,
                stats,
                timestamp: new Date(),
            });
        } catch (error: any) {
            console.error('Failed to get sync stats:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to get sync stats',
                error: error.message,
            });
        }
    }
);

export { router as syncRoutes };
