# 📚 Chapter 5: Rate Limiting

## 🎯 Learning Objectives

By the end of this chapter, you will understand:

- Why rate limiting is essential for APIs
- Different rate limiting algorithms
- Implementing rate limiting with Redis
- Creating reusable middleware

---

## 🤔 Why Rate Limit?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    WHY RATE LIMITING MATTERS                                 │
│                                                                              │
│   WITHOUT RATE LIMITING:                                                    │
│   ──────────────────────                                                    │
│                                                                              │
│   Bad Actor ──▶ 10,000 requests/second ──▶ Your API ──▶ 💥 CRASH!          │
│                                                                              │
│   Problems:                                                                 │
│   • Denial of Service (DoS) attacks                                         │
│   • Runaway scripts/bots                                                    │
│   • Unexpected traffic spikes                                               │
│   • Unfair resource usage                                                   │
│   • Increased infrastructure costs                                          │
│                                                                              │
│   WITH RATE LIMITING:                                                       │
│   ───────────────────                                                       │
│                                                                              │
│   Bad Actor ──▶ 10,000 requests ──▶ Rate Limiter ──▶ "429 Too Many"        │
│                                          │                                   │
│   Good User ──▶ 10 requests ─────────────┴──▶ Your API ──▶ ✅ Response     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Rate Limiting Algorithms

### Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    RATE LIMITING ALGORITHMS                                  │
│                                                                              │
│   1. FIXED WINDOW                    2. SLIDING WINDOW LOG                  │
│   ────────────────                   ────────────────────                   │
│   |  100  |  100  |                  Tracks each request timestamp          │
│   |-------|-------|                  More accurate, more memory             │
│   0      60     120 sec                                                     │
│                                                                              │
│   3. SLIDING WINDOW COUNTER          4. TOKEN BUCKET                        │
│   ─────────────────────────          ────────────────                       │
│   Weighted average of windows        🪣 Tokens added at fixed rate         │
│   Balance of accuracy & memory       Each request consumes a token          │
│                                                                              │
│   5. LEAKY BUCKET                                                           │
│   ───────────────                                                           │
│   🪣 Requests queue and process                                             │
│   at fixed rate (smooths bursts)                                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1️⃣ Fixed Window Counter

**Simplest approach:** Count requests in fixed time windows.

### How It Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FIXED WINDOW COUNTER                                      │
│                                                                              │
│   Limit: 100 requests per minute                                            │
│                                                                              │
│   Window 1 (0:00-1:00)    Window 2 (1:00-2:00)                              │
│   ┌────────────────────┐  ┌────────────────────┐                            │
│   │ Count: 87          │  │ Count: 15          │                            │
│   │ Requests: ✅✅✅... │  │ Requests: ✅✅...  │                            │
│   └────────────────────┘  └────────────────────┘                            │
│                                                                              │
│   Problem: "Boundary burst"                                                 │
│   ───────────────────────                                                   │
│   0:59 → 99 requests (window 1)                                             │
│   1:01 → 99 requests (window 2)                                             │
│   = 198 requests in 2 seconds! (but each window is under limit)             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Implementation

```typescript
class FixedWindowRateLimiter {
  private redis: RedisClientType;

  constructor(redis: RedisClientType) {
    this.redis = redis;
  }

  /**
   * Check if request is allowed
   * @returns { allowed: boolean, remaining: number, resetAt: number }
   */
  async isAllowed(
    identifier: string,  // User ID, IP, API key
    limit: number,       // Max requests
    windowSeconds: number = 60
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    // Get current window
    const now = Math.floor(Date.now() / 1000);
    const window = Math.floor(now / windowSeconds);
    const key = `ratelimit:${identifier}:${window}`;
    
    // Increment counter
    const count = await this.redis.incr(key);
    
    // Set expiry on first request
    if (count === 1) {
      await this.redis.expire(key, windowSeconds);
    }
    
    const allowed = count <= limit;
    const remaining = Math.max(0, limit - count);
    const resetAt = (window + 1) * windowSeconds;
    
    return { allowed, remaining, resetAt };
  }
}

// Usage
const rateLimiter = new FixedWindowRateLimiter(redis);

const result = await rateLimiter.isAllowed('user:123', 100, 60);
if (!result.allowed) {
  throw new TooManyRequestsError(`Rate limit exceeded. Retry after ${result.resetAt}`);
}
```

---

## 2️⃣ Sliding Window Log

**Most accurate:** Track timestamp of each request.

### How It Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SLIDING WINDOW LOG                                        │
│                                                                              │
│   Stores timestamps of all requests in the window:                          │
│                                                                              │
│   Key: ratelimit:user:123                                                   │
│   Sorted Set: [                                                             │
│     { timestamp: 1704470400.001, score: 1704470400.001 },                   │
│     { timestamp: 1704470400.150, score: 1704470400.150 },                   │
│     { timestamp: 1704470401.234, score: 1704470401.234 },                   │
│     ...                                                                      │
│   ]                                                                          │
│                                                                              │
│   On each request:                                                          │
│   1. Remove entries older than window                                       │
│   2. Count remaining entries                                                │
│   3. If count < limit, add new entry                                        │
│                                                                              │
│   ✅ Most accurate (no boundary issues)                                     │
│   ❌ High memory usage (stores every timestamp)                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Implementation

```typescript
class SlidingWindowLogRateLimiter {
  private redis: RedisClientType;

  async isAllowed(
    identifier: string,
    limit: number,
    windowSeconds: number = 60
  ): Promise<{ allowed: boolean; remaining: number }> {
    const key = `ratelimit:log:${identifier}`;
    const now = Date.now();
    const windowStart = now - (windowSeconds * 1000);
    
    // Use pipeline for atomic operations
    const pipeline = this.redis.multi();
    
    // Remove old entries
    pipeline.zRemRangeByScore(key, 0, windowStart);
    
    // Count current entries
    pipeline.zCard(key);
    
    // Execute
    const results = await pipeline.exec();
    const count = results[1] as number;
    
    if (count < limit) {
      // Add new entry
      await this.redis.zAdd(key, { score: now, value: now.toString() });
      await this.redis.expire(key, windowSeconds);
      
      return { allowed: true, remaining: limit - count - 1 };
    }
    
    return { allowed: false, remaining: 0 };
  }
}
```

---

## 3️⃣ Sliding Window Counter (Recommended!)

**Best balance:** Approximates sliding window with less memory.

### How It Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SLIDING WINDOW COUNTER                                    │
│                                                                              │
│   Combines two fixed windows with weighted average:                         │
│                                                                              │
│   Previous Window     Current Window                                        │
│   (complete)          (in progress)                                         │
│   ┌───────────────┐   ┌───────────────┐                                     │
│   │  Count: 80    │   │  Count: 20    │                                     │
│   └───────────────┘   └───────────────┘                                     │
│                            │                                                 │
│                     We're 25% into                                          │
│                     current window                                          │
│                                                                              │
│   Calculation:                                                              │
│   ────────────                                                              │
│   Previous weight = 75% (time remaining in window)                          │
│   Current weight = 25% (time elapsed in window)                             │
│                                                                              │
│   Estimated count = (80 × 0.75) + (20 × 1.0) = 60 + 20 = 80                │
│                                                                              │
│   If limit is 100: 80 < 100 ✅ Allowed!                                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Implementation

```typescript
class SlidingWindowCounterRateLimiter {
  private redis: RedisClientType;

  async isAllowed(
    identifier: string,
    limit: number,
    windowSeconds: number = 60
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const now = Math.floor(Date.now() / 1000);
    const currentWindow = Math.floor(now / windowSeconds);
    const previousWindow = currentWindow - 1;
    
    const currentKey = `ratelimit:${identifier}:${currentWindow}`;
    const previousKey = `ratelimit:${identifier}:${previousWindow}`;
    
    // Get counts from both windows
    const [currentCount, previousCount] = await Promise.all([
      this.redis.get(currentKey).then(v => parseInt(v || '0')),
      this.redis.get(previousKey).then(v => parseInt(v || '0'))
    ]);
    
    // Calculate position in current window (0.0 to 1.0)
    const windowPosition = (now % windowSeconds) / windowSeconds;
    
    // Weighted count
    const previousWeight = 1 - windowPosition;
    const estimatedCount = Math.floor(
      (previousCount * previousWeight) + currentCount
    );
    
    if (estimatedCount >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: (currentWindow + 1) * windowSeconds
      };
    }
    
    // Increment current window
    await this.redis.incr(currentKey);
    await this.redis.expire(currentKey, windowSeconds * 2); // Keep for 2 windows
    
    return {
      allowed: true,
      remaining: limit - estimatedCount - 1,
      resetAt: (currentWindow + 1) * windowSeconds
    };
  }
}
```

---

## 4️⃣ Token Bucket

**Allows bursts:** Tokens accumulate and can be used in bursts.

### How It Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        TOKEN BUCKET                                          │
│                                                                              │
│   🪣 Bucket with capacity of 10 tokens                                      │
│                                                                              │
│   Tokens added: 1 per second (refill rate)                                  │
│   Each request: consumes 1 token                                            │
│                                                                              │
│   Time  │ Tokens │ Action          │ Result                                 │
│   ──────┼────────┼─────────────────┼───────────────────                     │
│   0:00  │ 10     │ Request         │ ✅ (9 remaining)                       │
│   0:01  │ 10     │ Burst: 10 req   │ ✅ all (0 remaining)                   │
│   0:02  │ 1      │ Request         │ ✅ (0 remaining)                       │
│   0:03  │ 1      │ 2 requests      │ ✅ first, ❌ second                    │
│   0:10  │ 8      │ --              │ Tokens refilled                        │
│                                                                              │
│   ✅ Allows controlled bursts                                               │
│   ✅ Smooth request rate over time                                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Implementation

```typescript
class TokenBucketRateLimiter {
  private redis: RedisClientType;

  async isAllowed(
    identifier: string,
    options: {
      capacity: number;      // Max tokens (burst limit)
      refillRate: number;    // Tokens per second
      tokensRequired?: number; // Tokens per request (default: 1)
    }
  ): Promise<{ allowed: boolean; tokens: number }> {
    const { capacity, refillRate, tokensRequired = 1 } = options;
    const key = `ratelimit:bucket:${identifier}`;
    
    // Lua script for atomic token bucket
    const script = `
      local key = KEYS[1]
      local capacity = tonumber(ARGV[1])
      local refillRate = tonumber(ARGV[2])
      local tokensRequired = tonumber(ARGV[3])
      local now = tonumber(ARGV[4])
      
      -- Get current state
      local bucket = redis.call('HMGET', key, 'tokens', 'lastRefill')
      local tokens = tonumber(bucket[1]) or capacity
      local lastRefill = tonumber(bucket[2]) or now
      
      -- Calculate tokens to add
      local elapsed = now - lastRefill
      local tokensToAdd = elapsed * refillRate
      tokens = math.min(capacity, tokens + tokensToAdd)
      
      -- Check if enough tokens
      if tokens >= tokensRequired then
        tokens = tokens - tokensRequired
        redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', now)
        redis.call('EXPIRE', key, 3600)
        return {1, tokens}
      else
        redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', now)
        redis.call('EXPIRE', key, 3600)
        return {0, tokens}
      end
    `;
    
    const now = Date.now() / 1000; // Seconds
    const result = await this.redis.eval(script, {
      keys: [key],
      arguments: [
        capacity.toString(),
        refillRate.toString(),
        tokensRequired.toString(),
        now.toString()
      ]
    }) as [number, number];
    
    return {
      allowed: result[0] === 1,
      tokens: result[1]
    };
  }
}

// Usage: 100 requests/minute with burst of 20
const limiter = new TokenBucketRateLimiter(redis);
const result = await limiter.isAllowed('user:123', {
  capacity: 20,           // Can burst up to 20 requests
  refillRate: 100 / 60,   // ~1.67 tokens per second
});
```

---

## 5️⃣ Express Middleware

### Complete Rate Limiting Middleware

```typescript
// middleware/rateLimiter.ts
import { Request, Response, NextFunction } from 'express';
import { RedisClientType } from 'redis';

interface RateLimitConfig {
  windowSeconds: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
  skipFailedRequests?: boolean;
  headers?: boolean;
}

export function createRateLimiter(
  redis: RedisClientType,
  config: RateLimitConfig
) {
  const {
    windowSeconds,
    maxRequests,
    keyGenerator = (req) => req.ip || 'unknown',
    skipFailedRequests = false,
    headers = true
  } = config;

  const limiter = new SlidingWindowCounterRateLimiter(redis);

  return async (req: Request, res: Response, next: NextFunction) => {
    const identifier = keyGenerator(req);
    
    try {
      const result = await limiter.isAllowed(identifier, maxRequests, windowSeconds);
      
      // Set rate limit headers
      if (headers) {
        res.set({
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetAt.toString(),
        });
      }
      
      if (!result.allowed) {
        res.status(429).json({
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Try again after ${new Date(result.resetAt * 1000).toISOString()}`,
          retryAfter: result.resetAt - Math.floor(Date.now() / 1000)
        });
        return;
      }
      
      next();
      
    } catch (error) {
      // If Redis fails, allow request (fail open)
      console.error('Rate limiter error:', error);
      next();
    }
  };
}

// Usage in Express app
import express from 'express';

const app = express();

// Global rate limit: 100 requests per minute per IP
app.use(createRateLimiter(redis, {
  windowSeconds: 60,
  maxRequests: 100,
  headers: true
}));

// Stricter limit for auth endpoints
app.use('/api/auth', createRateLimiter(redis, {
  windowSeconds: 60,
  maxRequests: 10,
  keyGenerator: (req) => `auth:${req.ip}`,
}));

// Per-user limit for authenticated routes
app.use('/api/orders', createRateLimiter(redis, {
  windowSeconds: 60,
  maxRequests: 50,
  keyGenerator: (req) => `orders:${req.user?.id || req.ip}`,
}));
```

---

## 6️⃣ Advanced: Tiered Rate Limits

Different limits for different user tiers:

```typescript
interface TierConfig {
  free: { rpm: number; daily: number };
  pro: { rpm: number; daily: number };
  enterprise: { rpm: number; daily: number };
}

const TIERS: TierConfig = {
  free: { rpm: 60, daily: 1000 },
  pro: { rpm: 300, daily: 10000 },
  enterprise: { rpm: 1000, daily: 100000 }
};

class TieredRateLimiter {
  async isAllowed(userId: string, tier: keyof TierConfig): Promise<boolean> {
    const config = TIERS[tier];
    
    // Check per-minute limit
    const minuteResult = await this.limiter.isAllowed(
      `minute:${userId}`,
      config.rpm,
      60
    );
    
    if (!minuteResult.allowed) {
      return false;
    }
    
    // Check daily limit
    const dailyResult = await this.limiter.isAllowed(
      `daily:${userId}`,
      config.daily,
      86400  // 24 hours
    );
    
    return dailyResult.allowed;
  }
}
```

---

## 📊 Algorithm Comparison

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 RATE LIMITING ALGORITHM COMPARISON                           │
│                                                                              │
│   Algorithm          │ Accuracy │ Memory │ Complexity │ Burst Handling      │
│   ───────────────────┼──────────┼────────┼────────────┼──────────────────   │
│   Fixed Window       │ ⭐⭐     │ ⭐     │ ⭐         │ Boundary issues     │
│   Sliding Log        │ ⭐⭐⭐⭐⭐│ ⭐⭐⭐⭐│ ⭐⭐       │ Perfect             │
│   Sliding Counter    │ ⭐⭐⭐⭐ │ ⭐⭐   │ ⭐⭐       │ Good approximation  │
│   Token Bucket       │ ⭐⭐⭐⭐ │ ⭐⭐   │ ⭐⭐⭐     │ Controlled bursts   │
│   Leaky Bucket       │ ⭐⭐⭐⭐ │ ⭐⭐   │ ⭐⭐⭐     │ Smooths bursts      │
│                                                                              │
│   RECOMMENDED:                                                              │
│   • Sliding Window Counter for most APIs                                    │
│   • Token Bucket for APIs that allow bursts                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛒 E-commerce Rate Limit Guidelines

| Endpoint | Limit | Window | Reasoning |
|----------|-------|--------|-----------|
| Product listing | 100/min | 1 min | Browsing is common |
| Product search | 60/min | 1 min | Prevent scraping |
| Add to cart | 30/min | 1 min | Reasonable shopping |
| Checkout | 10/min | 1 min | Prevent fraud |
| Login | 5/min | 1 min | Brute force prevention |
| Password reset | 3/hour | 1 hour | Security critical |
| Order API | 100/day | 24 hours | Business limit |

---

## 🧠 Quick Recap

| Algorithm | Best For | Trade-off |
|-----------|----------|-----------|
| **Fixed Window** | Simple needs | Boundary bursts |
| **Sliding Log** | Exact limits | High memory |
| **Sliding Counter** | Most cases | Good balance |
| **Token Bucket** | Burst allowance | More complex |

---

## 🏋️ Exercises

1. **Add middleware**: Implement rate limiting for your Product Service
2. **Different limits**: Create tiered limits for different API endpoints
3. **Monitor**: Log rate limit hits to track potential abuse

---

## ➡️ Next Chapter

[Chapter 6: Session Management](./06-session-management.md) - Stateless authentication with Redis!

