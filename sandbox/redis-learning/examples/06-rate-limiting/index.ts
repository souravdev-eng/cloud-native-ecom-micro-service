/**
 * Rate Limiting - Learning Example
 *
 * Protect your APIs from abuse and ensure fair resource usage
 *
 * Run: npx ts-node 06-rate-limiting/index.ts
 */

import { createClient, RedisClientType } from 'redis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

/**
 * Fixed Window Rate Limiter
 * Simple but has boundary burst issues
 */
class FixedWindowRateLimiter {
  private redis: RedisClientType;

  constructor(redis: RedisClientType) {
    this.redis = redis;
  }

  async isAllowed(
    identifier: string,
    limit: number,
    windowSeconds: number
  ): Promise<RateLimitResult> {
    const now = Math.floor(Date.now() / 1000);
    const window = Math.floor(now / windowSeconds);
    const key = `ratelimit:fixed:${identifier}:${window}`;

    // Increment counter atomically
    const count = await this.redis.incr(key);

    // Set expiry on first request
    if (count === 1) {
      await this.redis.expire(key, windowSeconds);
    }

    const allowed = count <= limit;
    const remaining = Math.max(0, limit - count);
    const resetAt = (window + 1) * windowSeconds;

    return {
      allowed,
      remaining,
      resetAt,
      retryAfter: allowed ? undefined : resetAt - now,
    };
  }
}

/**
 * Sliding Window Counter Rate Limiter
 * Better accuracy with reasonable memory usage
 */
class SlidingWindowRateLimiter {
  private redis: RedisClientType;

  constructor(redis: RedisClientType) {
    this.redis = redis;
  }

  async isAllowed(
    identifier: string,
    limit: number,
    windowSeconds: number
  ): Promise<RateLimitResult> {
    const now = Math.floor(Date.now() / 1000);
    const currentWindow = Math.floor(now / windowSeconds);
    const previousWindow = currentWindow - 1;

    const currentKey = `ratelimit:sliding:${identifier}:${currentWindow}`;
    const previousKey = `ratelimit:sliding:${identifier}:${previousWindow}`;

    // Get counts from both windows
    const [currentCount, previousCount] = await Promise.all([
      this.redis.get(currentKey).then((v) => parseInt(v || '0')),
      this.redis.get(previousKey).then((v) => parseInt(v || '0')),
    ]);

    // Calculate position in current window (0.0 to 1.0)
    const windowPosition = (now % windowSeconds) / windowSeconds;

    // Weighted count: previous window counts proportionally less
    const previousWeight = 1 - windowPosition;
    const estimatedCount = Math.floor(previousCount * previousWeight + currentCount);

    if (estimatedCount >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: (currentWindow + 1) * windowSeconds,
        retryAfter: Math.ceil((1 - windowPosition) * windowSeconds),
      };
    }

    // Increment current window
    await this.redis.incr(currentKey);
    await this.redis.expire(currentKey, windowSeconds * 2);

    return {
      allowed: true,
      remaining: limit - estimatedCount - 1,
      resetAt: (currentWindow + 1) * windowSeconds,
    };
  }
}

/**
 * Token Bucket Rate Limiter
 * Allows controlled bursts
 */
class TokenBucketRateLimiter {
  private redis: RedisClientType;

  constructor(redis: RedisClientType) {
    this.redis = redis;
  }

  async isAllowed(
    identifier: string,
    options: {
      capacity: number; // Max tokens (burst limit)
      refillRate: number; // Tokens per second
    }
  ): Promise<{ allowed: boolean; tokens: number }> {
    const { capacity, refillRate } = options;
    const key = `ratelimit:bucket:${identifier}`;
    const now = Date.now() / 1000;

    // Lua script for atomic token bucket
    const script = `
      local key = KEYS[1]
      local capacity = tonumber(ARGV[1])
      local refillRate = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])
      
      -- Get current state
      local bucket = redis.call('HMGET', key, 'tokens', 'lastRefill')
      local tokens = tonumber(bucket[1]) or capacity
      local lastRefill = tonumber(bucket[2]) or now
      
      -- Calculate tokens to add based on time elapsed
      local elapsed = now - lastRefill
      local tokensToAdd = elapsed * refillRate
      tokens = math.min(capacity, tokens + tokensToAdd)
      
      -- Try to consume one token
      if tokens >= 1 then
        tokens = tokens - 1
        redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', now)
        redis.call('EXPIRE', key, 3600)
        return {1, tokens}
      else
        redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', now)
        redis.call('EXPIRE', key, 3600)
        return {0, tokens}
      end
    `;

    const result = (await this.redis.eval(script, {
      keys: [key],
      arguments: [capacity.toString(), refillRate.toString(), now.toString()],
    })) as [number, number];

    return {
      allowed: result[0] === 1,
      tokens: Math.floor(result[1] * 100) / 100,
    };
  }
}

/**
 * Simulate API requests
 */
async function simulateRequests(
  name: string,
  limiter: { isAllowed: (id: string, ...args: unknown[]) => Promise<unknown> },
  args: unknown[],
  requestCount: number,
  delayMs: number
): Promise<{ allowed: number; blocked: number }> {
  let allowed = 0;
  let blocked = 0;

  console.log(`\n${name}:`);
  console.log(`Making ${requestCount} requests with ${delayMs}ms delay...\n`);

  for (let i = 0; i < requestCount; i++) {
    const result = await limiter.isAllowed('test-user', ...(args as [unknown]));
    const isAllowed = 'allowed' in (result as object) ? (result as { allowed: boolean }).allowed : false;

    if (isAllowed) {
      allowed++;
      process.stdout.write('✅');
    } else {
      blocked++;
      process.stdout.write('❌');
    }

    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  console.log(`\n\nResults: ${allowed} allowed, ${blocked} blocked`);
  return { allowed, blocked };
}

async function main() {
  const client: RedisClientType = createClient({ url: REDIS_URL });
  client.on('error', (err) => console.error('Redis Error:', err));
  await client.connect();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚦 RATE LIMITING DEMO');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await client.flushDb();

  // ============================================
  // Demo 1: Fixed Window Rate Limiter
  // ============================================
  console.log('📊 Demo 1: Fixed Window Rate Limiter');
  console.log('────────────────────────────────────────');
  console.log('Limit: 10 requests per 5 seconds');

  const fixedLimiter = new FixedWindowRateLimiter(client);

  // Make 15 requests quickly
  await simulateRequests(
    'Burst of 15 requests',
    fixedLimiter,
    [10, 5], // limit, windowSeconds
    15,
    50
  );

  // Wait for window to reset
  console.log('\nWaiting 6 seconds for window reset...');
  await new Promise((resolve) => setTimeout(resolve, 6000));

  await simulateRequests('After window reset', fixedLimiter, [10, 5], 5, 50);

  // ============================================
  // Demo 2: Sliding Window Rate Limiter
  // ============================================
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Demo 2: Sliding Window Rate Limiter');
  console.log('────────────────────────────────────────');
  console.log('Limit: 10 requests per 5 seconds');
  console.log('(More accurate - no boundary issues)\n');

  const slidingLimiter = new SlidingWindowRateLimiter(client);

  await simulateRequests(
    'Burst of 15 requests',
    slidingLimiter,
    [10, 5], // limit, windowSeconds
    15,
    50
  );

  // ============================================
  // Demo 3: Token Bucket Rate Limiter
  // ============================================
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Demo 3: Token Bucket Rate Limiter');
  console.log('────────────────────────────────────────');
  console.log('Capacity: 5 tokens, Refill: 2 tokens/second');
  console.log('(Allows bursts up to capacity)\n');

  const tokenLimiter = new TokenBucketRateLimiter(client);

  console.log('Initial burst (should allow 5, then block):');
  for (let i = 0; i < 8; i++) {
    const result = await tokenLimiter.isAllowed('bucket-user', {
      capacity: 5,
      refillRate: 2,
    });
    console.log(`  Request ${i + 1}: ${result.allowed ? '✅' : '❌'} (${result.tokens.toFixed(1)} tokens remaining)`);
  }

  console.log('\nWaiting 2 seconds for tokens to refill...');
  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log('After refill (should have ~4 tokens):');
  for (let i = 0; i < 6; i++) {
    const result = await tokenLimiter.isAllowed('bucket-user', {
      capacity: 5,
      refillRate: 2,
    });
    console.log(`  Request ${i + 1}: ${result.allowed ? '✅' : '❌'} (${result.tokens.toFixed(1)} tokens remaining)`);
  }

  // ============================================
  // Demo 4: Different Limits for Different Endpoints
  // ============================================
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Demo 4: Endpoint-Specific Rate Limits');
  console.log('────────────────────────────────────────\n');

  const limits = {
    'GET /api/products': { limit: 100, window: 60 }, // 100/min - browsing
    'POST /api/orders': { limit: 10, window: 60 }, // 10/min - checkout
    'POST /api/auth/login': { limit: 5, window: 60 }, // 5/min - security
  };

  console.log('Configured limits:');
  for (const [endpoint, config] of Object.entries(limits)) {
    console.log(`  ${endpoint}: ${config.limit} requests per ${config.window}s`);
  }

  console.log('\nSimulating requests to different endpoints:');

  for (const [endpoint, config] of Object.entries(limits)) {
    const result = await slidingLimiter.isAllowed(`user:123:${endpoint}`, config.limit, config.window);
    console.log(`  ${endpoint}: ${result.allowed ? '✅ Allowed' : '❌ Blocked'} (${result.remaining} remaining)`);
  }

  // ============================================
  // Summary
  // ============================================
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RATE LIMITING SUMMARY\n');
  console.log(`
  ALGORITHMS COMPARISON:
  ──────────────────────
  
  Fixed Window:
  • Simple to implement
  • Can allow 2x limit at window boundaries
  • Best for: Simple use cases
  
  Sliding Window:
  • More accurate rate limiting
  • Prevents boundary issues
  • Best for: Most APIs (recommended!)
  
  Token Bucket:
  • Allows controlled bursts
  • Smooth rate over time
  • Best for: APIs that need burst capability

  HTTP HEADERS TO RETURN:
  ───────────────────────
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 95
  X-RateLimit-Reset: 1704470400
  Retry-After: 30 (when blocked)

  E-COMMERCE RATE LIMITS:
  ───────────────────────
  • Product listing: 100/min (browsing)
  • Product search: 60/min (prevent scraping)
  • Add to cart: 30/min (reasonable shopping)
  • Checkout: 10/min (prevent fraud)
  • Login: 5/min (brute force prevention)
  `);

  await client.quit();
  console.log('\n👋 Demo complete!');
}

main().catch(console.error);

