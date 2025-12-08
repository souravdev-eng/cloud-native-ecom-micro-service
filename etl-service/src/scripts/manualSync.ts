#!/usr/bin/env ts-node

import { DatabaseConnections } from '../database/connections';
import { ProductSyncService } from '../etl/productSync';
// import { logger } from '@ecom-micro/common';

async function runManualSync() {
    try {
        // Parse command line arguments
        const args = process.argv.slice(2);
        const dryRun = args.includes('--dry-run');
        const batchSizeArg = args.find(arg => arg.startsWith('--batch-size='));
        const batchSize = batchSizeArg ? parseInt(batchSizeArg.split('=')[1]) : 100;

        console.log('Starting manual ETL sync...');
        console.log(`Dry run: ${dryRun}`);
        console.log(`Batch size: ${batchSize}`);

        // Initialize database connections
        await DatabaseConnections.initialize();
        console.log('Database connections established');

        // Run the sync
        const result = await ProductSyncService.syncProducts({
            dryRun,
            batchSize,
            onProgress: (progress) => {
                const percentage = Math.round((progress.processed / progress.total) * 100);
                console.log(`Progress: ${progress.processed}/${progress.total} (${percentage}%)`);
            },
        });

        // Display results
        console.log('\n=== Sync Results ===');
        console.log(`Total products in source: ${result.totalProductsInSource}`);
        console.log(`Total products in target: ${result.totalProductsInTarget}`);
        console.log(`Missing products found: ${result.missingProducts}`);
        console.log(`Products synced: ${result.syncedProducts}`);
        console.log(`Duration: ${result.duration}ms`);
        console.log(`Errors: ${result.errors.length}`);

        if (result.errors.length > 0) {
            console.log('\nErrors:');
            result.errors.forEach(error => console.log(`- ${error}`));
        }

        // Validate sync if not dry run
        if (!dryRun && result.syncedProducts > 0) {
            console.log('Validating sync...');
            const validation = await ProductSyncService.validateSync();
            console.log(`\nSync validation: ${validation.isValid ? 'PASSED' : 'FAILED'}`);
            if (!validation.isValid) {
                console.log('Validation details:', validation.details);
            }
        }

        await DatabaseConnections.close();
        console.log('Manual sync completed successfully');
        process.exit(0);
    } catch (error: any) {
        console.error('Manual sync failed:', error.message);
        await DatabaseConnections.close();
        process.exit(1);
    }
}

// Handle process termination
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down...');
    await DatabaseConnections.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down...');
    await DatabaseConnections.close();
    process.exit(0);
});

// Run the script
runManualSync();
