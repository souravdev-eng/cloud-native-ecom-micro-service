import * as cron from 'node-cron';
import { ProductSyncService } from '../etl/productSync';
import { CartOrderSyncService } from '../etl/cartOrderSync';

export class CronScheduler {
    private static syncTask: cron.ScheduledTask | null = null;
    private static cartSyncTask: cron.ScheduledTask | null = null;
    private static healthCheckTask: cron.ScheduledTask | null = null;
    private static isRunning = false;
    private static isCartSyncRunning = false;
    private static syncTaskStarted = false;
    private static cartSyncTaskStarted = false;
    private static healthCheckTaskStarted = false;

    static initialize() {
        const syncSchedule = process.env.SYNC_CRON_SCHEDULE || '*/30 * * * *'; // Default: every 30 minutes
        const healthCheckSchedule = process.env.HEALTH_CHECK_CRON_SCHEDULE || '*/5 * * * *'; // Default: every 5 minutes
        const enableScheduler = process.env.ENABLE_SCHEDULER !== 'false'; // Default: enabled

        if (!enableScheduler) {
            console.log('Scheduler is disabled via environment variable');
            return;
        }

        // Validate cron expressions
        if (!cron.validate(syncSchedule)) {
            console.error(`Invalid sync cron schedule: ${syncSchedule}`);
            throw new Error(`Invalid sync cron schedule: ${syncSchedule}`);
        }

        if (!cron.validate(healthCheckSchedule)) {
            console.error(`Invalid health check cron schedule: ${healthCheckSchedule}`);
            throw new Error(`Invalid health check cron schedule: ${healthCheckSchedule}`);
        }

        // Schedule sync task
        this.syncTask = cron.schedule(
            syncSchedule,
            async () => {
                await this.runScheduledSync();
            },
            {
                scheduled: true,
                timezone: process.env.TIMEZONE || 'UTC',
            }
        );
        this.syncTaskStarted = true;

        // Schedule health check task
        this.healthCheckTask = cron.schedule(
            healthCheckSchedule,
            async () => {
                await this.runHealthCheck();
            },
            {
                scheduled: true,
                timezone: process.env.TIMEZONE || 'UTC',
            }
        );
        this.healthCheckTaskStarted = true;

        // Schedule Cart → Order sync task
        const cartSyncSchedule = process.env.CART_SYNC_CRON_SCHEDULE || '*/10 * * * *'; // Default: every 10 minutes
        if (cron.validate(cartSyncSchedule)) {
            this.cartSyncTask = cron.schedule(
                cartSyncSchedule,
                async () => {
                    await this.runScheduledCartSync();
                },
                {
                    scheduled: true,
                    timezone: process.env.TIMEZONE || 'UTC',
                }
            );
            this.cartSyncTaskStarted = true;
            console.log(`Cart sync scheduled with: ${cartSyncSchedule}`);
        }

        console.log(`Scheduler initialized with product sync schedule: ${syncSchedule}`);
        console.log(`Health check scheduled with: ${healthCheckSchedule}`);
        console.log(`Timezone: ${process.env.TIMEZONE || 'UTC'}`);
    }

    private static async runScheduledSync() {
        if (this.isRunning) {
            console.warn('Sync already running, skipping scheduled execution');
            return;
        }

        this.isRunning = true;
        const startTime = Date.now();

        try {
            console.log('Starting scheduled product sync...');

            const batchSize = parseInt(process.env.SYNC_BATCH_SIZE || '100');
            const result = await ProductSyncService.syncProducts({
                batchSize,
                dryRun: false,
                onProgress: (progress) => {
                    const percentage = Math.round((progress.processed / progress.total) * 100);
                    console.log(`Sync progress: ${progress.processed}/${progress.total} (${percentage}%)`);
                },
            });

            const duration = Date.now() - startTime;
            console.log('Scheduled sync completed', {
                totalProductsInSource: result.totalProductsInSource,
                totalProductsInTarget: result.totalProductsInTarget,
                missingProducts: result.missingProducts,
                syncedProducts: result.syncedProducts,
                duration,
                errors: result.errors.length,
            });

            // Log errors if any
            if (result.errors.length > 0) {
                console.error('Sync completed with errors:', result.errors);
            }

            // Validate sync if products were synced
            if (result.syncedProducts > 0) {
                const validation = await ProductSyncService.validateSync();
                if (!validation.isValid) {
                    console.error('Sync validation failed:', validation.details);
                } else {
                    console.log('Sync validation passed');
                }
            }
        } catch (error: any) {
            console.error('Scheduled sync failed:', error.message);
        } finally {
            this.isRunning = false;
        }
    }

    private static async runScheduledCartSync() {
        if (this.isCartSyncRunning) {
            console.warn('Cart sync already running, skipping scheduled execution');
            return;
        }

        this.isCartSyncRunning = true;
        const startTime = Date.now();

        try {
            console.log('Starting scheduled Cart → Order sync...');

            const batchSize = parseInt(process.env.CART_SYNC_BATCH_SIZE || '100');
            const result = await CartOrderSyncService.syncCarts({
                batchSize,
                dryRun: false,
                onProgress: (progress) => {
                    const percentage = Math.round((progress.processed / progress.total) * 100);
                    console.log(`Cart sync progress: ${progress.processed}/${progress.total} (${percentage}%)`);
                },
            });

            const duration = Date.now() - startTime;
            console.log('Scheduled Cart sync completed', {
                totalCartsInSource: result.totalCartsInSource,
                totalCartsInTarget: result.totalCartsInTarget,
                missingCarts: result.missingCarts,
                syncedCarts: result.syncedCarts,
                updatedCarts: result.updatedCarts,
                duration,
                errors: result.errors.length,
            });

            if (result.errors.length > 0) {
                console.error('Cart sync completed with errors:', result.errors);
            }
        } catch (error: any) {
            console.error('Scheduled cart sync failed:', error.message);
        } finally {
            this.isCartSyncRunning = false;
        }
    }

    private static async runHealthCheck() {
        try {
            const [productStats, cartStats] = await Promise.all([
                ProductSyncService.getStats(),
                CartOrderSyncService.getStats().catch(() => ({ sourceCount: 0, targetCount: 0 })),
            ]);

            console.log('Health check completed', {
                products: {
                    sourceCount: productStats.sourceCount,
                    targetCount: productStats.targetCount,
                },
                carts: {
                    sourceCount: cartStats.sourceCount,
                    targetCount: cartStats.targetCount,
                },
            });
        } catch (error: any) {
            console.error('Health check failed:', error.message);
        }
    }

    static startSync() {
        if (this.syncTask && !this.syncTaskStarted) {
            this.syncTask.start();
            this.syncTaskStarted = true;
            console.log('Sync scheduler started');
        }
    }

    static stopSync() {
        if (this.syncTask && this.syncTaskStarted) {
            this.syncTask.stop();
            this.syncTaskStarted = false;
            console.log('Sync scheduler stopped');
        }
    }

    static startHealthCheck() {
        if (this.healthCheckTask && !this.healthCheckTaskStarted) {
            this.healthCheckTask.start();
            this.healthCheckTaskStarted = true;
            console.log('Health check scheduler started');
        }
    }

    static stopHealthCheck() {
        if (this.healthCheckTask && this.healthCheckTaskStarted) {
            this.healthCheckTask.stop();
            this.healthCheckTaskStarted = false;
            console.log('Health check scheduler stopped');
        }
    }

    static destroy() {
        if (this.syncTask) {
            this.syncTask.stop();
            this.syncTask = null;
            this.syncTaskStarted = false;
            console.log('Product sync scheduler destroyed');
        }

        if (this.cartSyncTask) {
            this.cartSyncTask.stop();
            this.cartSyncTask = null;
            this.cartSyncTaskStarted = false;
            console.log('Cart sync scheduler destroyed');
        }

        if (this.healthCheckTask) {
            this.healthCheckTask.stop();
            this.healthCheckTask = null;
            this.healthCheckTaskStarted = false;
            console.log('Health check scheduler destroyed');
        }
    }

    static getStatus() {
        return {
            productSyncScheduler: {
                exists: !!this.syncTask,
                running: this.syncTaskStarted,
                schedule: process.env.SYNC_CRON_SCHEDULE || '*/30 * * * *',
                isRunning: this.isRunning,
            },
            cartSyncScheduler: {
                exists: !!this.cartSyncTask,
                running: this.cartSyncTaskStarted,
                schedule: process.env.CART_SYNC_CRON_SCHEDULE || '*/10 * * * *',
                isRunning: this.isCartSyncRunning,
            },
            healthCheckScheduler: {
                exists: !!this.healthCheckTask,
                running: this.healthCheckTaskStarted,
                schedule: process.env.HEALTH_CHECK_CRON_SCHEDULE || '*/5 * * * *',
            },
            timezone: process.env.TIMEZONE || 'UTC',
            enabled: process.env.ENABLE_SCHEDULER !== 'false',
        };
    }

    static async triggerManualSync() {
        if (this.isRunning) {
            throw new Error('Sync is already running');
        }

        console.log('Manual sync triggered via scheduler');
        await this.runScheduledSync();
    }
}
