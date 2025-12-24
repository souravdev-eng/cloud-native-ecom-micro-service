import { Router, Request, Response } from 'express';
import { requireAuth, BadRequestError } from '@ecom-micro/common';
import { CartOrderSyncService } from '../etl/cartOrderSync';

const router = Router();

/**
 * POST /api/etl/sync/user
 * Sync carts for the current authenticated user (useful before checkout)
 * This is a user-facing endpoint that syncs their cart data to Order Service
 */
router.post(
    '/api/etl/sync/user',
    requireAuth,
    async (req: Request, res: Response) => {
        try {
            const userId = req.user?.id;

            if (!userId) {
                throw new BadRequestError('User ID required');
            }

            console.log(`User cart sync triggered for user ${userId}`);

            const result = await CartOrderSyncService.syncUserCarts(userId);

            res.status(200).json({
                success: true,
                message: 'User cart sync completed',
                result,
            });
        } catch (error: any) {
            console.error('User cart sync failed:', error.message);
            res.status(500).json({
                success: false,
                message: 'User cart sync failed',
                error: error.message,
            });
        }
    }
);

export { router as cartSyncRoutes };

