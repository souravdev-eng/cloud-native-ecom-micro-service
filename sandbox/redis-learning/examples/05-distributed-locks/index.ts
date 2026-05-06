/**
 * Distributed Locks - Learning Example
 *
 * Prevent race conditions in flash sales and inventory management
 *
 * Run: npx ts-node 05-distributed-locks/index.ts
 */

import { createClient, RedisClientType } from 'redis';
import crypto from 'crypto';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Simulated inventory
let inventory: Record<string, number> = {
    'product:iphone': 5,
    'product:macbook': 3,
};

/**
 * Simple Redis Lock implementation
 */
class RedisLock {
    private redis: RedisClientType;

    constructor(redis: RedisClientType) {
        this.redis = redis;
    }

    /**
     * Acquire a lock
     * @returns Lock token if acquired, null if lock is held
     */
    async acquire(lockName: string, ttlSeconds: number = 10): Promise<string | null> {
        const token = crypto.randomUUID();
        const key = `lock:${lockName}`;

        // SET NX = Set if Not eXists
        const result = await this.redis.set(key, token, {
            NX: true, // Only set if doesn't exist
            EX: ttlSeconds, // Auto-expire (prevent deadlocks!)
        });

        return result === 'OK' ? token : null;
    }

    /**
     * Release a lock (only if we own it!)
     */
    async release(lockName: string, token: string): Promise<boolean> {
        const key = `lock:${lockName}`;

        // Lua script for atomic check-and-delete
        // This ensures we only delete our own lock
        const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

        const result = await this.redis.eval(script, {
            keys: [key],
            arguments: [token],
        });

        return result === 1;
    }

    /**
     * Acquire lock with retry
     */
    async acquireWithRetry(
        lockName: string,
        options: {
            ttlSeconds?: number;
            maxRetries?: number;
            retryDelayMs?: number;
        } = {}
    ): Promise<string | null> {
        const { ttlSeconds = 10, maxRetries = 5, retryDelayMs = 200 } = options;

        let retries = 0;

        while (retries < maxRetries) {
            const token = await this.acquire(lockName, ttlSeconds);

            if (token) {
                return token;
            }

            // Exponential backoff with jitter
            const delay = retryDelayMs * Math.pow(2, retries) + Math.random() * 100;
            await new Promise((resolve) => setTimeout(resolve, delay));
            retries++;
        }

        return null;
    }
}

/**
 * Inventory service with distributed locking
 */
class InventoryService {
    private lock: RedisLock;

    constructor(lock: RedisLock) {
        this.lock = lock;
    }

    /**
     * Purchase with lock protection
     */
    async purchase(
        productId: string,
        quantity: number,
        customerId: string
    ): Promise<{ success: boolean; message: string }> {
        const lockName = `inventory:${productId}`;

        console.log(`    🔒 [${customerId}] Attempting to acquire lock...`);
        const lockToken = await this.lock.acquireWithRetry(lockName, {
            ttlSeconds: 10,
            maxRetries: 5,
            retryDelayMs: 100,
        });

        if (!lockToken) {
            console.log(`    ❌ [${customerId}] Failed to acquire lock!`);
            return {
                success: false,
                message: 'Item is being purchased by another customer. Please try again.',
            };
        }

        console.log(`    ✅ [${customerId}] Lock acquired! Processing...`);

        try {
            // Simulate some processing time
            await new Promise((resolve) => setTimeout(resolve, 50));

            // Check inventory
            const currentStock = inventory[productId] || 0;
            console.log(`    📦 [${customerId}] Current stock: ${currentStock}`);

            if (currentStock < quantity) {
                return {
                    success: false,
                    message: `Insufficient stock. Only ${currentStock} available.`,
                };
            }

            // Decrement inventory (simulated DB update)
            await new Promise((resolve) => setTimeout(resolve, 30));
            inventory[productId] = currentStock - quantity;

            console.log(`    ✨ [${customerId}] Purchase successful! New stock: ${inventory[productId]}`);

            return {
                success: true,
                message: `Successfully purchased ${quantity} item(s). Remaining: ${inventory[productId]}`,
            };
        } finally {
            // ALWAYS release the lock!
            const released = await this.lock.release(lockName, lockToken);
            console.log(`    🔓 [${customerId}] Lock released: ${released ? 'Yes' : 'Failed (expired?)'}`);
        }
    }

    /**
     * Purchase WITHOUT lock (dangerous!)
     */
    async purchaseWithoutLock(
        productId: string,
        quantity: number,
        customerId: string
    ): Promise<{ success: boolean; message: string }> {
        console.log(`    ⚠️  [${customerId}] No lock! Checking inventory...`);

        // Check inventory
        const currentStock = inventory[productId] || 0;
        console.log(`    📦 [${customerId}] Current stock: ${currentStock}`);

        if (currentStock < quantity) {
            return {
                success: false,
                message: `Insufficient stock. Only ${currentStock} available.`,
            };
        }

        // Simulate processing delay (this is where race conditions happen!)
        await new Promise((resolve) => setTimeout(resolve, 50));

        // Decrement inventory
        inventory[productId] = currentStock - quantity;
        console.log(`    ✨ [${customerId}] Purchase "successful"! New stock: ${inventory[productId]}`);

        return {
            success: true,
            message: `Successfully purchased ${quantity} item(s).`,
        };
    }
}

async function main() {
    const client: RedisClientType = createClient({ url: REDIS_URL });
    client.on('error', (err) => console.error('Redis Error:', err));
    await client.connect();

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔒 DISTRIBUTED LOCKS DEMO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await client.flushDb();

    const lock = new RedisLock(client);
    const inventoryService = new InventoryService(lock);

    // ============================================
    // Demo 1: Race Condition WITHOUT Locks
    // ============================================
    console.log('🚨 Demo 1: Race Condition WITHOUT Locks\n');
    console.log('Scenario: 5 iPhones in stock, 3 customers trying to buy 2 each');
    console.log('Expected: Only 2 should succeed (5 items / 2 per customer)\n');

    // Reset inventory
    inventory = { 'product:iphone': 5 };

    // Simulate 3 concurrent customers WITHOUT locks
    console.log('Processing WITHOUT locks (will cause overselling!):\n');
    const noLockResults = await Promise.all([
        inventoryService.purchaseWithoutLock('product:iphone', 2, 'Customer-A'),
        inventoryService.purchaseWithoutLock('product:iphone', 2, 'Customer-B'),
        inventoryService.purchaseWithoutLock('product:iphone', 2, 'Customer-C'),
    ]);

    console.log('\n📊 Results WITHOUT locks:');
    noLockResults.forEach((r, i) => {
        console.log(`    Customer-${String.fromCharCode(65 + i)}: ${r.success ? '✅' : '❌'} ${r.message}`);
    });
    console.log(`    Final inventory: ${inventory['product:iphone']} (should be ≥ 0)`);
    console.log(`    ⚠️  OVERSOLD! Inventory went negative!`);

    // ============================================
    // Demo 2: Protected by Distributed Lock
    // ============================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Demo 2: Protected by Distributed Lock\n');
    console.log('Same scenario with proper locking:\n');

    // Reset inventory
    inventory = { 'product:iphone': 5 };

    // Simulate 3 concurrent customers WITH locks
    console.log('Processing WITH locks (protected!):\n');
    const lockResults = await Promise.all([
        inventoryService.purchase('product:iphone', 2, 'Customer-X'),
        inventoryService.purchase('product:iphone', 2, 'Customer-Y'),
        inventoryService.purchase('product:iphone', 2, 'Customer-Z'),
    ]);

    console.log('\n📊 Results WITH locks:');
    lockResults.forEach((r, i) => {
        const name = String.fromCharCode(88 + i);
        console.log(`    Customer-${name}: ${r.success ? '✅' : '❌'} ${r.message}`);
    });
    console.log(`    Final inventory: ${inventory['product:iphone']} (always ≥ 0)`);

    // ============================================
    // Demo 3: Lock Expiration (Deadlock Prevention)
    // ============================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⏰ Demo 3: Lock Expiration (Deadlock Prevention)\n');

    // Acquire a lock but "forget" to release it
    console.log('Acquiring lock with 2 second TTL (simulating crash)...');
    const forgottenToken = await lock.acquire('test:deadlock', 2);
    console.log(`Lock acquired: ${forgottenToken ? 'Yes' : 'No'}`);

    console.log('Trying to acquire same lock immediately (should fail)...');
    const blocked = await lock.acquire('test:deadlock', 2);
    console.log(`Second acquire: ${blocked ? 'Success' : 'Blocked (as expected)'}`);

    console.log('\nWaiting 3 seconds for lock to expire...');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log('Trying again after TTL expired...');
    const afterExpiry = await lock.acquire('test:deadlock', 2);
    console.log(`Acquire after expiry: ${afterExpiry ? '✅ Success!' : 'Still blocked'}`);

    if (afterExpiry) {
        await lock.release('test:deadlock', afterExpiry);
    }

    // ============================================
    // Summary
    // ============================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 DISTRIBUTED LOCKS SUMMARY\n');
    console.log(`
  WHY DISTRIBUTED LOCKS?
  ──────────────────────
  • Multiple service instances can modify same data
  • Race conditions cause overselling, double-processing
  • Locks ensure only ONE process modifies at a time

  IMPLEMENTATION:
  ───────────────
  • SETNX (Set if Not eXists) for atomic lock acquisition
  • Random token to identify lock owner
  • TTL to prevent deadlocks if process crashes
  • Lua script for atomic check-and-release

  BEST PRACTICES:
  ───────────────
  ✅ Always use try/finally to release locks
  ✅ Set appropriate TTL (2-3x expected operation time)
  ✅ Use lock tokens to prevent releasing others' locks
  ✅ Implement retry with exponential backoff
  ✅ Lock at the smallest scope possible

  E-COMMERCE USE CASES:
  ─────────────────────
  • Flash sales inventory
  • Preventing duplicate order processing
  • Payment transaction protection
  • Coupon/voucher redemption
  `);

    await client.quit();
    console.log('\n👋 Demo complete!');
}

main().catch(console.error);

