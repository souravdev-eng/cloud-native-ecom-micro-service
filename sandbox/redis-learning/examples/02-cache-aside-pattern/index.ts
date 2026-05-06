/**
 * Cache-Aside Pattern (Lazy Loading) - Learning Example
 *
 * This is the pattern your Product Service uses!
 *
 * Run: npx ts-node 02-cache-aside-pattern/index.ts
 */

import { createClient, RedisClientType } from 'redis';
import crypto from 'crypto';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Simulated database
const database: Record<string, Product> = {
  'product:123': {
    id: '123',
    name: 'iPhone 15 Pro',
    price: 999,
    category: 'electronics',
  },
  'product:456': {
    id: '456',
    name: 'MacBook Pro M3',
    price: 2499,
    category: 'electronics',
  },
  'product:789': {
    id: '789',
    name: 'AirPods Pro',
    price: 249,
    category: 'electronics',
  },
};

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface CacheStats {
  hits: number;
  misses: number;
}

class CacheAsideExample {
  private redis: RedisClientType;
  private stats: CacheStats = { hits: 0, misses: 0 };
  private defaultTTL = 300; // 5 minutes

  constructor(redis: RedisClientType) {
    this.redis = redis;
  }

  /**
   * Simulates a slow database query
   */
  private async queryDatabase(productId: string): Promise<Product | null> {
    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 100));
    console.log(`    📀 [DB] Querying database for product:${productId}`);
    return database[`product:${productId}`] || null;
  }

  /**
   * Cache-Aside Pattern: Get product
   */
  async getProduct(productId: string): Promise<Product | null> {
    const cacheKey = `cache:product:${productId}`;

    // Step 1: Check cache first
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      // CACHE HIT - Return immediately
      this.stats.hits++;
      console.log(`    ⚡ [CACHE HIT] Returning cached product:${productId}`);
      return JSON.parse(cached);
    }

    // Step 2: CACHE MISS - Query database
    this.stats.misses++;
    console.log(`    ❄️  [CACHE MISS] Cache miss for product:${productId}`);

    const product = await this.queryDatabase(productId);

    if (product) {
      // Step 3: Store in cache for next time
      await this.redis.set(cacheKey, JSON.stringify(product), {
        EX: this.defaultTTL,
      });
      console.log(`    💾 [CACHE SET] Cached product:${productId} (TTL: ${this.defaultTTL}s)`);
    }

    return product;
  }

  /**
   * Cache-Aside Pattern: Get product with custom TTL
   */
  async getProductWithTTL(productId: string, ttlSeconds: number): Promise<Product | null> {
    const cacheKey = `cache:product:${productId}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.stats.hits++;
      return JSON.parse(cached);
    }

    this.stats.misses++;
    const product = await this.queryDatabase(productId);

    if (product) {
      await this.redis.set(cacheKey, JSON.stringify(product), {
        EX: ttlSeconds,
      });
    }

    return product;
  }

  /**
   * Search products with caching (like your Product Service!)
   */
  async searchProducts(query: { search?: string; category?: string; limit?: number }): Promise<{
    products: Product[];
    cached: boolean;
  }> {
    // Generate cache key from query (like your generateSearchCacheKey)
    const cacheKey = this.generateSearchCacheKey(query);

    // Check cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.stats.hits++;
      console.log(`    ⚡ [CACHE HIT] Search results from cache`);
      return { products: JSON.parse(cached), cached: true };
    }

    // Cache miss - "query database"
    this.stats.misses++;
    console.log(`    ❄️  [CACHE MISS] Searching database...`);
    await new Promise((resolve) => setTimeout(resolve, 150)); // Simulate search

    // Filter products (simulated search)
    let results = Object.values(database);
    if (query.search) {
      results = results.filter((p) => p.name.toLowerCase().includes(query.search!.toLowerCase()));
    }
    if (query.category) {
      results = results.filter((p) => p.category === query.category);
    }
    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    // Cache results (longer TTL for search results)
    if (results.length > 0) {
      await this.redis.set(cacheKey, JSON.stringify(results), {
        EX: 600, // 10 minutes for search results
      });
      console.log(`    💾 [CACHE SET] Cached search results`);
    }

    return { products: results, cached: false };
  }

  /**
   * Generate cache key from query (similar to your cacheKeys.ts)
   */
  private generateSearchCacheKey(query: Record<string, unknown>): string {
    const normalized = JSON.stringify(
      Object.fromEntries(Object.entries(query).filter(([, v]) => v !== undefined).sort())
    );
    const hash = crypto.createHash('md5').update(normalized).digest('hex').slice(0, 8);
    return `cache:search:${hash}`;
  }

  /**
   * Invalidate cache on update (important for consistency!)
   */
  async updateProduct(productId: string, updates: Partial<Product>): Promise<Product | null> {
    console.log(`\n📝 Updating product:${productId}...`);

    // Step 1: Update database
    const key = `product:${productId}`;
    if (!database[key]) {
      return null;
    }

    database[key] = { ...database[key], ...updates };
    console.log(`    📀 [DB] Updated in database`);

    // Step 2: INVALIDATE cache (not update!)
    // This is the recommended approach for cache-aside
    await this.redis.del(`cache:product:${productId}`);
    console.log(`    🗑️  [CACHE DEL] Invalidated cache`);

    // Step 3: Also invalidate search caches (they might contain old data)
    const searchKeys = await this.redis.keys('cache:search:*');
    if (searchKeys.length > 0) {
      await this.redis.del(searchKeys);
      console.log(`    🗑️  [CACHE DEL] Invalidated ${searchKeys.length} search caches`);
    }

    return database[key];
  }

  getStats(): CacheStats & { hitRate: string } {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? ((this.stats.hits / total) * 100).toFixed(1) : '0.0';
    return { ...this.stats, hitRate: `${hitRate}%` };
  }

  resetStats(): void {
    this.stats = { hits: 0, misses: 0 };
  }
}

async function main() {
  const client: RedisClientType = createClient({ url: REDIS_URL });
  client.on('error', (err) => console.error('Redis Error:', err));
  await client.connect();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔄 CACHE-ASIDE PATTERN DEMO');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Clear previous test data
  await client.flushDb();

  const cache = new CacheAsideExample(client);

  // ============================================
  // Demo 1: Basic Cache-Aside
  // ============================================
  console.log('📦 Demo 1: Basic Cache-Aside Pattern\n');

  console.log('First request (should be CACHE MISS):');
  const product1 = await cache.getProduct('123');
  console.log(`    Result: ${product1?.name}\n`);

  console.log('Second request (should be CACHE HIT):');
  const product2 = await cache.getProduct('123');
  console.log(`    Result: ${product2?.name}\n`);

  console.log('Third request (should be CACHE HIT):');
  const product3 = await cache.getProduct('123');
  console.log(`    Result: ${product3?.name}\n`);

  console.log(`Stats: ${JSON.stringify(cache.getStats())}\n`);

  // ============================================
  // Demo 2: Search with Caching
  // ============================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 Demo 2: Search Results Caching\n');
  cache.resetStats();

  console.log('First search (CACHE MISS):');
  const search1 = await cache.searchProducts({ category: 'electronics' });
  console.log(`    Found ${search1.products.length} products\n`);

  console.log('Same search again (CACHE HIT):');
  const search2 = await cache.searchProducts({ category: 'electronics' });
  console.log(`    Found ${search2.products.length} products\n`);

  console.log('Different search (CACHE MISS):');
  const search3 = await cache.searchProducts({ search: 'iPhone' });
  console.log(`    Found ${search3.products.length} products\n`);

  console.log(`Stats: ${JSON.stringify(cache.getStats())}\n`);

  // ============================================
  // Demo 3: Cache Invalidation on Update
  // ============================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔄 Demo 3: Cache Invalidation on Update\n');
  cache.resetStats();

  console.log('Get product (CACHE HIT from Demo 1):');
  await cache.getProduct('123');
  console.log();

  // Update the product
  await cache.updateProduct('123', { price: 899 });
  console.log();

  console.log('Get product after update (should be CACHE MISS - was invalidated):');
  const updated = await cache.getProduct('123');
  console.log(`    Updated price: $${updated?.price}\n`);

  // ============================================
  // Summary
  // ============================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 CACHE-ASIDE PATTERN SUMMARY\n');
  console.log(`
  READ FLOW:
  ──────────
  1. Check cache for data
  2. If CACHE HIT → Return immediately
  3. If CACHE MISS → Query database
  4. Store result in cache
  5. Return to client

  WRITE FLOW:
  ───────────
  1. Update database
  2. INVALIDATE cache (delete, don't update)
  3. Next read will refresh cache

  KEY BENEFITS:
  ─────────────
  ✅ Only caches data that's actually accessed
  ✅ Cache failures don't break the app (fallback to DB)
  ✅ Simple to understand and implement
  ✅ Works with any database

  YOUR PRODUCT SERVICE:
  ─────────────────────
  • showProduct.ts uses this exact pattern!
  • generateSearchCacheKey() creates consistent cache keys
  • shouldCache() decides what to cache
  `);

  await client.quit();
  console.log('\n👋 Demo complete!');
}

main().catch(console.error);

