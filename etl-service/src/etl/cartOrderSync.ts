import { Cart } from '../entities/Cart';
import { OrderCart, OrderCartDoc } from '../models/OrderCartModel';
import { DatabaseConnections } from '../database/connections';

export interface CartSyncResult {
    totalCartsInSource: number;
    totalCartsInTarget: number;
    missingCarts: number;
    syncedCarts: number;
    updatedCarts: number;
    errors: string[];
    duration: number;
    timestamp: Date;
}

export interface CartSyncOptions {
    batchSize?: number;
    dryRun?: boolean;
    userId?: string; // Optional: sync only for specific user
    onProgress?: (progress: { processed: number; total: number }) => void;
}

interface CartWithProduct {
    id: string;
    quantity: number;
    userId: string;
    version: number;
    productId: string;
    productTitle: string;
    productPrice: number;
    productImage: string;
    sellerId: string;
    productQuantity: number;
}

/**
 * Cart to Order ETL Sync Service
 * Syncs cart data from Cart Service (PostgreSQL) to Order Service (MongoDB)
 */
export class CartOrderSyncService {
    private static readonly DEFAULT_BATCH_SIZE = 100;

    /**
     * Main sync method - Full ETL Pipeline
     */
    static async syncCarts(options: CartSyncOptions = {}): Promise<CartSyncResult> {
        const startTime = Date.now();
        const result: CartSyncResult = {
            totalCartsInSource: 0,
            totalCartsInTarget: 0,
            missingCarts: 0,
            syncedCarts: 0,
            updatedCarts: 0,
            errors: [],
            duration: 0,
            timestamp: new Date(),
        };

        try {
            console.log('=== Starting Cart → Order ETL Sync ===');

            // EXTRACT: Fetch carts from Cart Service (PostgreSQL)
            const sourceCarts = await this.extractFromCartService(options.userId);
            result.totalCartsInSource = sourceCarts.length;
            console.log(`EXTRACT: Found ${sourceCarts.length} carts in Cart Service`);

            if (sourceCarts.length === 0) {
                console.log('No carts to sync');
                result.duration = Date.now() - startTime;
                return result;
            }

            // Fetch existing carts from Order Service (MongoDB)
            const targetCarts = await this.fetchTargetCarts(options.userId);
            result.totalCartsInTarget = targetCarts.length;
            console.log(`EXTRACT: Found ${targetCarts.length} carts in Order Service`);

            // TRANSFORM & IDENTIFY: Find missing and outdated carts
            const { missing, outdated } = this.identifyChanges(sourceCarts, targetCarts);
            result.missingCarts = missing.length;
            console.log(`TRANSFORM: ${missing.length} missing, ${outdated.length} outdated`);

            if (missing.length === 0 && outdated.length === 0) {
                console.log('Databases are in sync - no changes needed');
                result.duration = Date.now() - startTime;
                return result;
            }

            // LOAD: Sync to Order Service MongoDB
            if (!options.dryRun) {
                // Sync missing carts
                if (missing.length > 0) {
                    result.syncedCarts = await this.loadNewCarts(
                        missing,
                        options.batchSize || this.DEFAULT_BATCH_SIZE,
                        options.onProgress
                    );
                }

                // Update outdated carts
                if (outdated.length > 0) {
                    result.updatedCarts = await this.updateExistingCarts(outdated);
                }
            } else {
                console.log('DRY RUN: No changes will be made');
            }

            result.duration = Date.now() - startTime;
            console.log(`=== Cart → Order ETL Sync completed in ${result.duration}ms ===`);

            return result;
        } catch (error: any) {
            result.errors.push(error.message);
            result.duration = Date.now() - startTime;
            console.error('Cart → Order sync failed:', error.message);
            throw error;
        }
    }

    /**
     * EXTRACT: Fetch carts from Cart Service (PostgreSQL)
     */
    private static async extractFromCartService(userId?: string): Promise<CartWithProduct[]> {
        try {
            const postgresConnection = DatabaseConnections.getPostgresConnection();
            const cartRepository = postgresConnection.getRepository(Cart);

            const queryBuilder = cartRepository
                .createQueryBuilder('cart')
                .leftJoinAndSelect('cart.product', 'product');

            if (userId) {
                queryBuilder.where('cart.userId = :userId', { userId });
            }

            const carts = await queryBuilder.getMany();

            // Transform to flat structure
            return carts.map((cart) => ({
                id: cart.id,
                quantity: cart.quantity,
                userId: cart.userId,
                version: cart.version,
                productId: cart.product?.id || cart.productId,
                productTitle: cart.product?.title || 'Unknown',
                productPrice: cart.product?.price || 0,
                productImage: cart.product?.image || '',
                sellerId: cart.product?.sellerId || 'unknown',
                productQuantity: cart.product?.quantity || 0,
            }));
        } catch (error: any) {
            console.error('Error extracting from Cart Service:', error.message);
            throw new Error(`Failed to extract from Cart Service: ${error.message}`);
        }
    }

    /**
     * Fetch existing carts from Order Service (MongoDB)
     */
    private static async fetchTargetCarts(userId?: string): Promise<OrderCartDoc[]> {
        try {
            const query = userId ? { userId } : {};
            return await OrderCart.find(query);
        } catch (error: any) {
            console.error('Error fetching from Order Service:', error.message);
            return [];
        }
    }

    /**
     * TRANSFORM: Identify missing and outdated carts
     */
    private static identifyChanges(
        sourceCarts: CartWithProduct[],
        targetCarts: OrderCartDoc[]
    ): { missing: CartWithProduct[]; outdated: CartWithProduct[] } {
        const targetCartMap = new Map<string, OrderCartDoc>();
        targetCarts.forEach((cart) => targetCartMap.set(cart.cartId, cart));

        const missing: CartWithProduct[] = [];
        const outdated: CartWithProduct[] = [];

        for (const sourceCart of sourceCarts) {
            const targetCart = targetCartMap.get(sourceCart.id);

            if (!targetCart) {
                missing.push(sourceCart);
            } else if (targetCart.version < sourceCart.version) {
                // Cart has been updated in source
                outdated.push(sourceCart);
            }
        }

        return { missing, outdated };
    }

    /**
     * LOAD: Insert new carts to Order Service MongoDB
     */
    private static async loadNewCarts(
        carts: CartWithProduct[],
        batchSize: number,
        onProgress?: (progress: { processed: number; total: number }) => void
    ): Promise<number> {
        let syncedCount = 0;

        for (let i = 0; i < carts.length; i += batchSize) {
            const batch = carts.slice(i, i + batchSize);

            try {
                const orderCarts = batch.map((cart) =>
                    OrderCart.build({
                        cartId: cart.id,
                        userId: cart.userId,
                        productId: cart.productId,
                        productTitle: cart.productTitle,
                        productPrice: cart.productPrice,
                        productImage: cart.productImage,
                        sellerId: cart.sellerId,
                        productQuantity: cart.productQuantity,
                        cartQuantity: cart.quantity,
                        total: cart.productPrice * cart.quantity,
                        version: cart.version,
                    })
                );

                await OrderCart.insertMany(orderCarts);
                syncedCount += orderCarts.length;

                console.log(`LOAD: Synced batch ${Math.floor(i / batchSize) + 1}: ${batch.length} carts`);

                if (onProgress) {
                    onProgress({ processed: i + batch.length, total: carts.length });
                }

                await this.delay(50);
            } catch (error: any) {
                console.error(`Error syncing batch at index ${i}:`, error.message);
                continue;
            }
        }

        return syncedCount;
    }

    /**
     * LOAD: Update existing carts in Order Service MongoDB
     */
    private static async updateExistingCarts(carts: CartWithProduct[]): Promise<number> {
        let updatedCount = 0;

        for (const cart of carts) {
            try {
                await OrderCart.findOneAndUpdate(
                    { cartId: cart.id },
                    {
                        $set: {
                            userId: cart.userId,
                            productId: cart.productId,
                            productTitle: cart.productTitle,
                            productPrice: cart.productPrice,
                            productImage: cart.productImage,
                            sellerId: cart.sellerId,
                            productQuantity: cart.productQuantity,
                            cartQuantity: cart.quantity,
                            total: cart.productPrice * cart.quantity,
                            version: cart.version,
                        },
                    },
                    { upsert: true }
                );
                updatedCount++;
            } catch (error: any) {
                console.error(`Error updating cart ${cart.id}:`, error.message);
            }
        }

        console.log(`LOAD: Updated ${updatedCount} carts`);
        return updatedCount;
    }

    /**
     * Validate sync status
     */
    static async validateSync(userId?: string): Promise<{ isValid: boolean; details: any }> {
        try {
            const sourceCarts = await this.extractFromCartService(userId);
            const targetCarts = await this.fetchTargetCarts(userId);

            const sourceIds = new Set(sourceCarts.map((c) => c.id));
            const targetIds = new Set(targetCarts.map((c) => c.cartId));

            const missingInTarget = sourceCarts.filter((c) => !targetIds.has(c.id));
            const extraInTarget = targetCarts.filter((c) => !sourceIds.has(c.cartId));

            const isValid = missingInTarget.length === 0;

            return {
                isValid,
                details: {
                    sourceCount: sourceCarts.length,
                    targetCount: targetCarts.length,
                    missingInTarget: missingInTarget.length,
                    extraInTarget: extraInTarget.length,
                    missingCartIds: missingInTarget.map((c) => c.id).slice(0, 10),
                    extraCartIds: extraInTarget.map((c) => c.cartId).slice(0, 10),
                },
            };
        } catch (error: any) {
            console.error('Error validating cart sync:', error.message);
            return {
                isValid: false,
                details: { error: error.message },
            };
        }
    }

    /**
     * Get sync statistics
     */
    static async getStats(userId?: string): Promise<{
        sourceCount: number;
        targetCount: number;
        lastSyncTime?: Date;
    }> {
        try {
            const sourceCarts = await this.extractFromCartService(userId);
            const targetCarts = await this.fetchTargetCarts(userId);

            return {
                sourceCount: sourceCarts.length,
                targetCount: targetCarts.length,
                lastSyncTime: new Date(),
            };
        } catch (error: any) {
            console.error('Error getting cart sync stats:', error.message);
            throw error;
        }
    }

    /**
     * Sync carts for a specific user (on-demand for checkout)
     */
    static async syncUserCarts(userId: string): Promise<CartSyncResult> {
        console.log(`Syncing carts for user: ${userId}`);
        return this.syncCarts({ userId, batchSize: 50 });
    }

    private static delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

