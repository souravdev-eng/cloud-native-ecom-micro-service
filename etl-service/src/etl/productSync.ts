// import { logger } from '@ecom-micro/common';
import { Product as MongoProduct, ProductDoc } from '../models/ProductModel';
import { Product as CartProduct } from '../entities/CartProduct';
import { DatabaseConnections } from '../database/connections';

export interface SyncResult {
    totalProductsInSource: number;
    totalProductsInTarget: number;
    missingProducts: number;
    syncedProducts: number;
    errors: string[];
    duration: number;
    timestamp: Date;
}

export interface SyncOptions {
    batchSize?: number;
    dryRun?: boolean;
    onProgress?: (progress: { processed: number; total: number }) => void;
}

export class ProductSyncService {
    private static readonly DEFAULT_BATCH_SIZE = 100;

    static async syncProducts(options: SyncOptions = {}): Promise<SyncResult> {
        const startTime = Date.now();
        const result: SyncResult = {
            totalProductsInSource: 0,
            totalProductsInTarget: 0,
            missingProducts: 0,
            syncedProducts: 0,
            errors: [],
            duration: 0,
            timestamp: new Date(),
        };

        try {
            console.log('Starting product synchronization...');

            // Step 1: Fetch all products from Product Service (MongoDB)
            const sourceProducts = await this.fetchSourceProducts();
            result.totalProductsInSource = sourceProducts.length;
            console.log(`Found ${sourceProducts.length} products in source (Product Service)`);

            // Step 2: Fetch all products from Cart Service (PostgreSQL)
            const targetProducts = await this.fetchTargetProducts();
            result.totalProductsInTarget = targetProducts.length;
            console.log(`Found ${targetProducts.length} products in target (Cart Service)`);

            // Step 3: Identify missing products
            const missingProducts = this.identifyMissingProducts(sourceProducts, targetProducts);
            result.missingProducts = missingProducts.length;
            console.log(`Identified ${missingProducts.length} missing products`);

            if (missingProducts.length === 0) {
                console.log('No products to sync - databases are in sync');
                result.duration = Date.now() - startTime;
                return result;
            }

            // Step 4: Sync missing products in batches
            if (!options.dryRun) {
                result.syncedProducts = await this.syncMissingProducts(
                    missingProducts,
                    options.batchSize || this.DEFAULT_BATCH_SIZE,
                    options.onProgress
                );
            } else {
                console.log('Dry run mode - no products will be synced');
                result.syncedProducts = 0;
            }

            result.duration = Date.now() - startTime;
            console.log(`Product synchronization completed in ${result.duration}ms`);

            return result;
        } catch (error: any) {
            result.errors.push(error.message);
            result.duration = Date.now() - startTime;
            console.error('Product synchronization failed:', error.message);
            throw error;
        }
    }

    private static async fetchSourceProducts(): Promise<ProductDoc[]> {
        try {
            // Don't use .lean() to get proper document instances with toJSON transformation
            return await MongoProduct.find({});
        } catch (error: any) {
            console.error('Error fetching source products:', error.message);
            throw new Error(`Failed to fetch products from Product Service: ${error.message}`);
        }
    }

    private static async fetchTargetProducts(): Promise<CartProduct[]> {
        try {
            const postgresConnection = DatabaseConnections.getPostgresConnection();
            const productRepository = postgresConnection.getRepository(CartProduct);
            return await productRepository.find();
        } catch (error: any) {
            console.error('Error fetching target products:', error.message);
            throw new Error(`Failed to fetch products from Cart Service: ${error.message}`);
        }
    }

    private static identifyMissingProducts(
        sourceProducts: ProductDoc[],
        targetProducts: CartProduct[]
    ): ProductDoc[] {
        const targetProductIds = new Set(targetProducts.map(p => p.id));
        return sourceProducts.filter(product => !targetProductIds.has(product.id));
    }

    private static async syncMissingProducts(
        missingProducts: ProductDoc[],
        batchSize: number,
        onProgress?: (progress: { processed: number; total: number }) => void
    ): Promise<number> {
        const postgresConnection = DatabaseConnections.getPostgresConnection();
        const productRepository = postgresConnection.getRepository(CartProduct);
        let syncedCount = 0;

        // Process products in batches
        for (let i = 0; i < missingProducts.length; i += batchSize) {
            const batch = missingProducts.slice(i, i + batchSize);

            try {
                // Convert MongoDB products to Cart products format
                const cartProducts = batch.map(product => {
                    const cartProduct = new CartProduct();
                    // Use the id field (transformed from _id by toJSON)
                    cartProduct.id = product.id;
                    cartProduct.title = product.title;
                    cartProduct.price = product.price;
                    cartProduct.image = product.image;
                    cartProduct.sellerId = product.sellerId.toString();
                    cartProduct.quantity = product.quantity || 0;
                    return cartProduct;
                });

                // Batch insert
                await productRepository.save(cartProducts);
                syncedCount += cartProducts.length;

                console.log(`Synced batch ${Math.floor(i / batchSize) + 1}: ${cartProducts.length} products`);

                // Report progress
                if (onProgress) {
                    onProgress({ processed: i + batch.length, total: missingProducts.length });
                }

                // Small delay to prevent overwhelming the database
                await this.delay(100);
            } catch (error: any) {
                console.error(`Error syncing batch starting at index ${i}:`, error.message);
                // Continue with next batch instead of failing completely
                continue;
            }
        }

        return syncedCount;
    }

    static async validateSync(): Promise<{ isValid: boolean; details: any }> {
        try {
            const sourceProducts = await this.fetchSourceProducts();
            const targetProducts = await this.fetchTargetProducts();

            const sourceIds = new Set(sourceProducts.map(p => p.id));
            const targetIds = new Set(targetProducts.map(p => p.id));

            const missingInTarget = sourceProducts.filter(p => !targetIds.has(p.id));
            const extraInTarget = targetProducts.filter(p => !sourceIds.has(p.id));

            const isValid = missingInTarget.length === 0;

            return {
                isValid,
                details: {
                    sourceCount: sourceProducts.length,
                    targetCount: targetProducts.length,
                    missingInTarget: missingInTarget.length,
                    extraInTarget: extraInTarget.length,
                    missingProductIds: missingInTarget.map(p => p.id),
                    extraProductIds: extraInTarget.map(p => p.id),
                }
            };
        } catch (error: any) {
            console.error('Error validating sync:', error.message);
            return {
                isValid: false,
                details: { error: error.message }
            };
        }
    }

    private static delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static async getStats(): Promise<{
        sourceCount: number;
        targetCount: number;
        lastSyncTime?: Date;
    }> {
        try {
            const [sourceProducts, targetProducts] = await Promise.all([
                this.fetchSourceProducts(),
                this.fetchTargetProducts()
            ]);

            return {
                sourceCount: sourceProducts.length,
                targetCount: targetProducts.length,
                lastSyncTime: new Date(), // This would be stored in a sync log table in production
            };
        } catch (error: any) {
            console.error('Error getting sync stats:', error.message);
            throw error;
        }
    }
}
