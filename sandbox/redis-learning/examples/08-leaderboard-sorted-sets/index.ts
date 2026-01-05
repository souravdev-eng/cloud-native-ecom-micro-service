/**
 * Leaderboards & Sorted Sets - Learning Example
 *
 * Build trending products, rankings, and autocomplete
 *
 * Run: npx ts-node 08-leaderboard-sorted-sets/index.ts
 */

import { createClient, RedisClientType } from 'redis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

/**
 * Trending Products Service
 */
class TrendingProductsService {
  private redis: RedisClientType;

  constructor(redis: RedisClientType) {
    this.redis = redis;
  }

  /**
   * Track a product interaction
   */
  async trackInteraction(
    productId: string,
    type: 'view' | 'cart' | 'purchase',
    category?: string
  ): Promise<void> {
    const weights = { view: 1, cart: 5, purchase: 10 };
    const weight = weights[type];

    const today = new Date().toISOString().split('T')[0];

    // Track in multiple time windows
    await Promise.all([
      this.redis.zIncrBy(`trending:daily:${today}`, weight, productId),
      this.redis.zIncrBy('trending:weekly', weight, productId),
      category ? this.redis.zIncrBy(`trending:category:${category}`, weight, productId) : Promise.resolve(),
    ]);

    // Set TTLs
    await this.redis.expire(`trending:daily:${today}`, 172800); // 48 hours
    if (category) {
      await this.redis.expire(`trending:category:${category}`, 86400);
    }
  }

  /**
   * Get trending products
   */
  async getTrending(options: {
    period?: 'daily' | 'weekly';
    category?: string;
    limit?: number;
  } = {}): Promise<{ productId: string; score: number; rank: number }[]> {
    const { period = 'daily', category, limit = 10 } = options;

    let key: string;
    if (category) {
      key = `trending:category:${category}`;
    } else if (period === 'daily') {
      key = `trending:daily:${new Date().toISOString().split('T')[0]}`;
    } else {
      key = 'trending:weekly';
    }

    const results = await this.redis.zRangeWithScores(key, 0, limit - 1, { REV: true });

    return results.map(({ value, score }, index) => ({
      productId: value,
      score,
      rank: index + 1,
    }));
  }

  /**
   * Get product rank
   */
  async getProductRank(productId: string): Promise<number | null> {
    const rank = await this.redis.zRevRank('trending:weekly', productId);
    return rank !== null ? rank + 1 : null;
  }
}

/**
 * Customer Rewards Leaderboard
 */
class RewardsLeaderboard {
  private redis: RedisClientType;
  private key = 'leaderboard:rewards';

  constructor(redis: RedisClientType) {
    this.redis = redis;
  }

  /**
   * Add points for a customer
   */
  async addPoints(customerId: string, points: number): Promise<{
    newTotal: number;
    rank: number;
  }> {
    const newTotal = await this.redis.zIncrBy(this.key, points, customerId);
    const rank = await this.redis.zRevRank(this.key, customerId);

    return {
      newTotal,
      rank: rank !== null ? rank + 1 : -1,
    };
  }

  /**
   * Get top customers
   */
  async getTopCustomers(limit: number = 10): Promise<{
    customerId: string;
    points: number;
    rank: number;
  }[]> {
    const results = await this.redis.zRangeWithScores(this.key, 0, limit - 1, { REV: true });

    return results.map(({ value, score }, index) => ({
      customerId: value,
      points: score,
      rank: index + 1,
    }));
  }

  /**
   * Get customer rank with surrounding context
   */
  async getCustomerRankWithContext(customerId: string, contextSize: number = 2): Promise<{
    customer: { customerId: string; points: number; rank: number };
    above: { customerId: string; points: number; rank: number }[];
    below: { customerId: string; points: number; rank: number }[];
  } | null> {
    const rank = await this.redis.zRevRank(this.key, customerId);
    if (rank === null) return null;

    const points = await this.redis.zScore(this.key, customerId);
    const startIndex = Math.max(0, rank - contextSize);
    const endIndex = rank + contextSize;

    const results = await this.redis.zRangeWithScores(this.key, startIndex, endIndex, { REV: true });

    const userIndex = rank - startIndex;

    return {
      customer: { customerId, points: points!, rank: rank + 1 },
      above: results.slice(0, userIndex).map((r, i) => ({
        customerId: r.value,
        points: r.score,
        rank: startIndex + i + 1,
      })),
      below: results.slice(userIndex + 1).map((r, i) => ({
        customerId: r.value,
        points: r.score,
        rank: rank + i + 2,
      })),
    };
  }
}

/**
 * Search Autocomplete
 */
class AutocompleteService {
  private redis: RedisClientType;

  constructor(redis: RedisClientType) {
    this.redis = redis;
  }

  /**
   * Index a product for autocomplete
   */
  async indexProduct(product: { id: string; name: string; popularity: number }): Promise<void> {
    const name = product.name.toLowerCase();

    // Add all prefixes (for "iPhone" → "i", "ip", "iph", "ipho", "iphon", "iphone")
    for (let i = 1; i <= name.length; i++) {
      const prefix = name.slice(0, i);
      await this.redis.zAdd(`autocomplete:${prefix}`, {
        score: product.popularity,
        value: JSON.stringify({ id: product.id, name: product.name }),
      });
    }
  }

  /**
   * Get autocomplete suggestions
   */
  async getSuggestions(query: string, limit: number = 5): Promise<{ id: string; name: string }[]> {
    const prefix = query.toLowerCase();
    const results = await this.redis.zRange(`autocomplete:${prefix}`, 0, limit - 1, { REV: true });

    return results.map((r) => JSON.parse(r));
  }

  /**
   * Boost a term when selected
   */
  async boostProduct(product: { id: string; name: string }, amount: number = 1): Promise<void> {
    const name = product.name.toLowerCase();
    const value = JSON.stringify({ id: product.id, name: product.name });

    for (let i = 1; i <= name.length; i++) {
      const prefix = name.slice(0, i);
      await this.redis.zIncrBy(`autocomplete:${prefix}`, amount, value);
    }
  }
}

async function main() {
  const client: RedisClientType = createClient({ url: REDIS_URL });
  client.on('error', (err) => console.error('Redis Error:', err));
  await client.connect();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🏆 SORTED SETS & LEADERBOARDS DEMO');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await client.flushDb();

  // ============================================
  // Demo 1: Trending Products
  // ============================================
  console.log('📈 Demo 1: Trending Products\n');

  const trending = new TrendingProductsService(client);

  // Simulate product interactions
  const products = [
    { id: 'iphone-15', name: 'iPhone 15 Pro', category: 'electronics' },
    { id: 'macbook-m3', name: 'MacBook Pro M3', category: 'electronics' },
    { id: 'airpods', name: 'AirPods Pro', category: 'electronics' },
    { id: 'watch-ultra', name: 'Apple Watch Ultra', category: 'electronics' },
    { id: 'nike-air', name: 'Nike Air Max', category: 'shoes' },
  ];

  console.log('Simulating user interactions...\n');

  // iPhone is very popular
  for (let i = 0; i < 50; i++) await trending.trackInteraction('iphone-15', 'view', 'electronics');
  for (let i = 0; i < 10; i++) await trending.trackInteraction('iphone-15', 'cart', 'electronics');
  for (let i = 0; i < 5; i++) await trending.trackInteraction('iphone-15', 'purchase', 'electronics');

  // MacBook is popular
  for (let i = 0; i < 30; i++) await trending.trackInteraction('macbook-m3', 'view', 'electronics');
  for (let i = 0; i < 5; i++) await trending.trackInteraction('macbook-m3', 'cart', 'electronics');
  for (let i = 0; i < 2; i++) await trending.trackInteraction('macbook-m3', 'purchase', 'electronics');

  // AirPods moderate
  for (let i = 0; i < 20; i++) await trending.trackInteraction('airpods', 'view', 'electronics');
  for (let i = 0; i < 8; i++) await trending.trackInteraction('airpods', 'cart', 'electronics');

  // Watch and Nike less popular
  for (let i = 0; i < 10; i++) await trending.trackInteraction('watch-ultra', 'view', 'electronics');
  for (let i = 0; i < 15; i++) await trending.trackInteraction('nike-air', 'view', 'shoes');

  // Get trending
  console.log('📊 Top Trending Products (All Categories):');
  const topTrending = await trending.getTrending({ period: 'weekly', limit: 5 });
  topTrending.forEach((p) => {
    const product = products.find((pr) => pr.id === p.productId);
    console.log(`  #${p.rank} ${product?.name || p.productId} - Score: ${p.score}`);
  });

  console.log('\n📊 Top Trending in Electronics:');
  const electronicsTrending = await trending.getTrending({ category: 'electronics', limit: 3 });
  electronicsTrending.forEach((p) => {
    const product = products.find((pr) => pr.id === p.productId);
    console.log(`  #${p.rank} ${product?.name || p.productId} - Score: ${p.score}`);
  });

  // ============================================
  // Demo 2: Customer Rewards Leaderboard
  // ============================================
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🏆 Demo 2: Customer Rewards Leaderboard\n');

  const leaderboard = new RewardsLeaderboard(client);

  // Add points for customers
  const customers = [
    { id: 'customer-alice', name: 'Alice' },
    { id: 'customer-bob', name: 'Bob' },
    { id: 'customer-charlie', name: 'Charlie' },
    { id: 'customer-diana', name: 'Diana' },
    { id: 'customer-eve', name: 'Eve' },
    { id: 'customer-frank', name: 'Frank' },
  ];

  console.log('Adding reward points...\n');

  await leaderboard.addPoints('customer-alice', 1500);
  await leaderboard.addPoints('customer-bob', 2300);
  await leaderboard.addPoints('customer-charlie', 800);
  await leaderboard.addPoints('customer-diana', 3100);
  await leaderboard.addPoints('customer-eve', 1200);
  await leaderboard.addPoints('customer-frank', 950);

  // Get top customers
  console.log('📊 Top Customers:');
  const topCustomers = await leaderboard.getTopCustomers(5);
  topCustomers.forEach((c) => {
    const customer = customers.find((cu) => cu.id === c.customerId);
    console.log(`  #${c.rank} ${customer?.name || c.customerId} - ${c.points} points`);
  });

  // Customer earns more points
  console.log('\n🎉 Alice makes a purchase and earns 1000 points...');
  const aliceResult = await leaderboard.addPoints('customer-alice', 1000);
  console.log(`  Alice new total: ${aliceResult.newTotal} points (Rank: #${aliceResult.rank})`);

  // Show Alice's context
  console.log('\n📊 Alice\'s Leaderboard Position:');
  const aliceContext = await leaderboard.getCustomerRankWithContext('customer-alice', 2);
  if (aliceContext) {
    aliceContext.above.forEach((c) => {
      const customer = customers.find((cu) => cu.id === c.customerId);
      console.log(`  #${c.rank} ${customer?.name} - ${c.points} points`);
    });
    console.log(`  ➡️ #${aliceContext.customer.rank} Alice - ${aliceContext.customer.points} points (YOU)`);
    aliceContext.below.forEach((c) => {
      const customer = customers.find((cu) => cu.id === c.customerId);
      console.log(`  #${c.rank} ${customer?.name} - ${c.points} points`);
    });
  }

  // ============================================
  // Demo 3: Search Autocomplete
  // ============================================
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 Demo 3: Search Autocomplete\n');

  const autocomplete = new AutocompleteService(client);

  // Index products
  console.log('Indexing products for autocomplete...\n');
  await autocomplete.indexProduct({ id: '1', name: 'iPhone 15 Pro', popularity: 100 });
  await autocomplete.indexProduct({ id: '2', name: 'iPhone 15', popularity: 80 });
  await autocomplete.indexProduct({ id: '3', name: 'iPhone 14', popularity: 60 });
  await autocomplete.indexProduct({ id: '4', name: 'iPad Pro', popularity: 70 });
  await autocomplete.indexProduct({ id: '5', name: 'iPad Air', popularity: 50 });
  await autocomplete.indexProduct({ id: '6', name: 'iMac', popularity: 40 });

  // Test autocomplete
  const queries = ['i', 'ip', 'iph', 'iphone'];

  for (const query of queries) {
    const suggestions = await autocomplete.getSuggestions(query, 3);
    console.log(`"${query}" → ${suggestions.map((s) => s.name).join(', ')}`);
  }

  // Boost a product when selected
  console.log('\n👆 User selects "iPhone 14" from autocomplete...');
  await autocomplete.boostProduct({ id: '3', name: 'iPhone 14' }, 5);

  console.log('Suggestions for "iphone" after boost:');
  const afterBoost = await autocomplete.getSuggestions('iphone', 3);
  afterBoost.forEach((s, i) => console.log(`  ${i + 1}. ${s.name}`));

  // ============================================
  // Summary
  // ============================================
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 SORTED SETS SUMMARY\n');
  console.log(`
  KEY COMMANDS:
  ─────────────
  ZADD key score member       Add/update with score
  ZINCRBY key incr member     Increment score atomically
  ZRANGE key start stop       Get by rank (ascending)
  ZREVRANGE key start stop    Get by rank (descending)
  ZRANGEBYSCORE key min max   Get by score range
  ZREVRANK key member         Get rank (0-indexed, descending)
  ZSCORE key member           Get score

  E-COMMERCE USE CASES:
  ─────────────────────
  • Trending products (score = views × 1 + carts × 5 + purchases × 10)
  • Customer rewards leaderboard
  • Search autocomplete (score = popularity)
  • Price-based filtering (score = price)
  • Time-based rankings (score = timestamp)
  • Real-time analytics dashboards
  `);

  await client.quit();
  console.log('\n👋 Demo complete!');
}

main().catch(console.error);

