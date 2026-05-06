/**
 * Redis Basic Operations - Learning Examples
 *
 * Run: npx ts-node 01-basic-operations/index.ts
 *
 * Prerequisites:
 * - Redis running on localhost:6379
 * - Run: docker run -d -p 6379:6379 redis:7-alpine
 */

import { createClient, RedisClientType } from 'redis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

async function main() {
    // Connect to Redis
    const client: RedisClientType = createClient({ url: REDIS_URL });

    client.on('error', (err) => console.error('Redis Error:', err));
    client.on('connect', () => console.log('✅ Connected to Redis\n'));

    await client.connect();

    try {
        // Clear any existing test data
        await client.flushDb();

        // ============================================
        // 1. STRINGS
        // ============================================
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📝 1. STRINGS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Basic SET and GET
        await client.set('product:123:name', 'iPhone 15 Pro');
        const productName = await client.get('product:123:name');
        console.log(`GET product:123:name → "${productName}"`);

        // SET with expiration
        await client.set('session:abc123', 'user_data', { EX: 300 }); // 5 minutes
        const ttl = await client.ttl('session:abc123');
        console.log(`TTL session:abc123 → ${ttl} seconds`);

        // SETNX (Set if Not eXists) - useful for locks!
        const firstSet = await client.setNX('lock:order:456', 'locked');
        const secondSet = await client.setNX('lock:order:456', 'locked');
        console.log(`SETNX lock:order:456 (1st) → ${firstSet ? 'Created' : 'Already exists'}`);
        console.log(`SETNX lock:order:456 (2nd) → ${secondSet ? 'Created' : 'Already exists'}`);

        // INCR/DECR - Atomic counters
        await client.set('product:123:views', '0');
        await client.incr('product:123:views');
        await client.incr('product:123:views');
        await client.incrBy('product:123:views', 10);
        const views = await client.get('product:123:views');
        console.log(`Views after INCR operations → ${views}`);

        // Store JSON
        const product = { id: '123', name: 'iPhone 15', price: 999, category: 'electronics' };
        await client.set('product:123', JSON.stringify(product));
        const cached = await client.get('product:123');
        console.log(`Cached product → ${cached}`);

        // ============================================
        // 2. HASHES
        // ============================================
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🗂️  2. HASHES');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Set multiple fields at once
        await client.hSet('user:456', {
            name: 'John Doe',
            email: 'john@example.com',
            cart_count: '0',
            last_login: new Date().toISOString(),
        });

        // Get single field
        const email = await client.hGet('user:456', 'email');
        console.log(`HGET user:456 email → "${email}"`);

        // Get all fields
        const user = await client.hGetAll('user:456');
        console.log('HGETALL user:456 →', user);

        // Increment a hash field
        await client.hIncrBy('user:456', 'cart_count', 3);
        const cartCount = await client.hGet('user:456', 'cart_count');
        console.log(`Cart count after HINCRBY → ${cartCount}`);

        // Shopping cart with hash
        await client.hSet('cart:user:456', {
            'product:123': '2',
            'product:789': '1',
            'product:456': '3',
        });
        const cart = await client.hGetAll('cart:user:456');
        console.log('Shopping cart →', cart);

        // ============================================
        // 3. LISTS
        // ============================================
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 3. LISTS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Recently viewed products (newest first)
        await client.lPush('recent:viewed:user:456', 'product:123');
        await client.lPush('recent:viewed:user:456', 'product:789');
        await client.lPush('recent:viewed:user:456', 'product:456');
        await client.lPush('recent:viewed:user:456', 'product:111');

        // Get last 3 viewed
        const recentlyViewed = await client.lRange('recent:viewed:user:456', 0, 2);
        console.log('Recently viewed (last 3) →', recentlyViewed);

        // Keep only last 10 (trim)
        await client.lTrim('recent:viewed:user:456', 0, 9);
        const listLength = await client.lLen('recent:viewed:user:456');
        console.log(`List length after LTRIM → ${listLength}`);

        // Queue example (FIFO)
        await client.rPush('queue:notifications', 'notification:1');
        await client.rPush('queue:notifications', 'notification:2');
        await client.rPush('queue:notifications', 'notification:3');

        // Pop from front (process in order)
        const firstNotification = await client.lPop('queue:notifications');
        console.log(`Processed notification → ${firstNotification}`);

        // ============================================
        // 4. SETS
        // ============================================
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔢 4. SETS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Product tags
        await client.sAdd('product:123:tags', 'electronics', 'smartphone', 'apple', '5g');
        await client.sAdd('product:123:tags', 'electronics'); // Duplicate - ignored

        const tags = await client.sMembers('product:123:tags');
        console.log('Product tags →', tags);

        // Check membership
        const hasTag = await client.sIsMember('product:123:tags', 'smartphone');
        console.log(`Is "smartphone" a tag? → ${hasTag ? 'Yes' : 'No'}`);

        // Unique visitors today
        await client.sAdd('visitors:2025-01-05', 'user:123', 'user:456', 'user:789');
        await client.sAdd('visitors:2025-01-05', 'user:123'); // Same user again - not counted

        const uniqueVisitors = await client.sCard('visitors:2025-01-05');
        console.log(`Unique visitors today → ${uniqueVisitors}`);

        // Wishlist
        await client.sAdd('wishlist:user:456', 'product:123', 'product:789');
        const inWishlist = await client.sIsMember('wishlist:user:456', 'product:123');
        console.log(`Is product:123 in wishlist? → ${inWishlist ? 'Yes' : 'No'}`);

        // Set operations
        await client.sAdd('tags:electronics', 'product:1', 'product:2', 'product:3');
        await client.sAdd('tags:apple', 'product:1', 'product:5');

        // Intersection - products that are both electronics AND apple
        const intersection = await client.sInter(['tags:electronics', 'tags:apple']);
        console.log('Electronics AND Apple products →', intersection);

        // ============================================
        // 5. SORTED SETS
        // ============================================
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🏆 5. SORTED SETS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Trending products (score = view count)
        await client.zAdd('trending:products', [
            { score: 150, value: 'product:123' },
            { score: 320, value: 'product:456' },
            { score: 89, value: 'product:789' },
            { score: 450, value: 'product:111' },
        ]);

        // Get top 3 trending (highest scores first)
        const topTrending = await client.zRange('trending:products', 0, 2, { REV: true });
        console.log('Top 3 trending products →', topTrending);

        // Get with scores
        const trendingWithScores = await client.zRangeWithScores('trending:products', 0, 2, {
            REV: true,
        });
        console.log(
            'Trending with scores →',
            trendingWithScores.map((x) => `${x.value}: ${x.score} views`)
        );

        // Increment score (product was viewed)
        await client.zIncrBy('trending:products', 50, 'product:789');
        const newScore = await client.zScore('trending:products', 'product:789');
        console.log(`product:789 new score after ZINCRBY → ${newScore}`);

        // Get rank of a product (0-indexed)
        const rank = await client.zRevRank('trending:products', 'product:456');
        console.log(`product:456 rank → #${rank !== null ? rank + 1 : 'N/A'}`);

        // Products by price (for filtering)
        await client.zAdd('products:by_price', [
            { score: 29.99, value: 'product:cheap1' },
            { score: 149.99, value: 'product:mid1' },
            { score: 499.99, value: 'product:mid2' },
            { score: 999.99, value: 'product:expensive1' },
        ]);

        // Get products under $200
        const affordable = await client.zRangeByScore('products:by_price', 0, 200);
        console.log('Products under $200 →', affordable);

        // ============================================
        // 6. TTL AND EXPIRATION
        // ============================================
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('⏰ 6. TTL AND EXPIRATION');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Set key with TTL
        await client.set('cache:temp', 'temporary data', { EX: 60 });
        let remainingTTL = await client.ttl('cache:temp');
        console.log(`Initial TTL → ${remainingTTL} seconds`);

        // Update TTL on existing key
        await client.expire('cache:temp', 120);
        remainingTTL = await client.ttl('cache:temp');
        console.log(`Updated TTL → ${remainingTTL} seconds`);

        // Remove TTL (persist key)
        await client.persist('cache:temp');
        remainingTTL = await client.ttl('cache:temp');
        console.log(`After PERSIST → ${remainingTTL} (-1 = no expiry)`);

        // Check TTL of non-existent key
        const nonExistentTTL = await client.ttl('nonexistent:key');
        console.log(`Non-existent key TTL → ${nonExistentTTL} (-2 = key doesn't exist)`);

        // ============================================
        // SUMMARY
        // ============================================
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ SUMMARY');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('Data Type    | Use Case                | Key Command');
        console.log('─────────────┼─────────────────────────┼─────────────');
        console.log('String       | Cache, counters         | GET, SET, INCR');
        console.log('Hash         | Objects, user profiles  | HSET, HGET, HGETALL');
        console.log('List         | Queues, recent items    | LPUSH, RPOP, LRANGE');
        console.log('Set          | Unique items, tags      | SADD, SISMEMBER, SINTER');
        console.log('Sorted Set   | Rankings, leaderboards  | ZADD, ZRANGE, ZINCRBY');
    } finally {
        // Clean up
        await client.quit();
        console.log('\n👋 Disconnected from Redis');
    }
}

main().catch(console.error);

