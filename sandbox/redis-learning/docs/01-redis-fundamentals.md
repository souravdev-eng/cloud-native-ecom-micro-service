# 📚 Chapter 1: Redis Fundamentals

## 🎯 Learning Objectives

By the end of this chapter, you will understand:

- What Redis is and when to use it
- All 5 core Redis data types
- Essential commands for each data type
- Memory management and TTL basics

---

## 🤔 What is Redis?

**Redis** = **RE**mote **DI**ctionary **S**erver

Redis is an **in-memory** data store that can be used as:
- 🚀 **Cache** - Store frequently accessed data
- 📦 **Database** - Persist data to disk
- 📬 **Message Broker** - Pub/Sub messaging

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           WHY REDIS IS FAST                                  │
│                                                                              │
│   Traditional Database                 Redis                                 │
│   ────────────────────                 ─────                                 │
│                                                                              │
│   Request → Disk Read → Response       Request → RAM Read → Response        │
│              ~10ms                                ~0.1ms                     │
│                                                                              │
│   📀 HDD/SSD: Slow                     🧠 RAM: 100x faster!                 │
│                                                                              │
│   Trade-off: Redis uses more memory, but is MUCH faster                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 The 5 Core Data Types

Redis supports 5 primary data structures. Each has specific use cases:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         REDIS DATA TYPES                                     │
│                                                                              │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│   │   STRING    │  │    HASH     │  │    LIST     │  │     SET     │       │
│   │             │  │             │  │             │  │             │       │
│   │  "hello"    │  │  field:val  │  │  [a,b,c,d]  │  │  {a,b,c}    │       │
│   │             │  │  field:val  │  │  (ordered)  │  │  (unique)   │       │
│   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
│                                                                              │
│                        ┌─────────────┐                                       │
│                        │ SORTED SET  │                                       │
│                        │             │                                       │
│                        │  a:10       │                                       │
│                        │  b:20       │                                       │
│                        │  (ranked)   │                                       │
│                        └─────────────┘                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1️⃣ Strings

**The most basic type.** Can store text, numbers, or serialized JSON.

### Commands

```bash
# Set a value
SET product:123:name "iPhone 15 Pro"

# Get a value
GET product:123:name
# → "iPhone 15 Pro"

# Set with expiration (5 minutes = 300 seconds)
SET session:abc123 "user_data" EX 300

# Set only if NOT exists (useful for locks!)
SETNX lock:checkout:order123 "locked"

# Increment (atomic!)
SET product:123:views 0
INCR product:123:views
# → 1
INCRBY product:123:views 10
# → 11
```

### E-commerce Use Cases

| Use Case | Key Pattern | Example |
|----------|-------------|---------|
| Product view count | `product:{id}:views` | `INCR product:123:views` |
| Simple cache | `cache:{type}:{id}` | `SET cache:product:123 "{...}"` |
| Feature flags | `feature:{name}` | `SET feature:dark_mode "enabled"` |

### TypeScript Example

```typescript
// From your product service pattern
import { createClient } from 'redis';

const client = createClient({ url: process.env.REDIS_URL });
await client.connect();

// Cache a product
const product = { id: '123', name: 'iPhone 15', price: 999 };
await client.set(`product:${product.id}`, JSON.stringify(product), {
  EX: 300  // 5 minutes
});

// Retrieve
const cached = await client.get('product:123');
const parsed = cached ? JSON.parse(cached) : null;
```

---

## 2️⃣ Hashes

**Like a mini JSON object.** Perfect for storing objects with multiple fields.

### Commands

```bash
# Set multiple fields at once
HSET product:123 name "iPhone 15" price 999 category "electronics"

# Get one field
HGET product:123 price
# → "999"

# Get all fields
HGETALL product:123
# → { name: "iPhone 15", price: "999", category: "electronics" }

# Increment a field (atomic!)
HINCRBY product:123 views 1

# Check if field exists
HEXISTS product:123 name
# → 1 (true)
```

### E-commerce Use Cases

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    HASH USE CASES IN E-COMMERCE                              │
│                                                                              │
│   Shopping Cart (Hash per user):                                            │
│   ──────────────────────────────                                            │
│   cart:user:456                                                             │
│   ├── product:123 → "2"  (quantity)                                         │
│   ├── product:789 → "1"                                                     │
│   └── product:456 → "3"                                                     │
│                                                                              │
│   User Profile (Hash per user):                                             │
│   ─────────────────────────────                                             │
│   user:456                                                                  │
│   ├── name → "John Doe"                                                     │
│   ├── email → "john@example.com"                                            │
│   ├── cart_count → "6"                                                      │
│   └── last_login → "2025-01-05"                                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### TypeScript Example

```typescript
// Shopping cart with Hash
const userId = 'user:456';

// Add item to cart
await client.hSet(`cart:${userId}`, {
  'product:123': '2',
  'product:789': '1'
});

// Get entire cart
const cart = await client.hGetAll(`cart:${userId}`);
// { 'product:123': '2', 'product:789': '1' }

// Update quantity
await client.hIncrBy(`cart:${userId}`, 'product:123', 1);

// Remove item
await client.hDel(`cart:${userId}`, 'product:789');
```

### Why Hash over String with JSON?

| Aspect | String (JSON) | Hash |
|--------|---------------|------|
| Update one field | Read → Parse → Modify → Write | `HSET key field value` |
| Memory efficiency | Less efficient | More efficient |
| Atomic field increment | Not possible | `HINCRBY` |
| Best for | Immutable data | Frequently updated objects |

---

## 3️⃣ Lists

**Ordered collection.** Perfect for queues, recent items, activity feeds.

### Commands

```bash
# Push to the left (newest first)
LPUSH recent:products:user:456 "product:123" "product:789"

# Push to the right (oldest first)
RPUSH queue:emails "email:1" "email:2"

# Get range (0 to -1 = all)
LRANGE recent:products:user:456 0 9
# → Last 10 viewed products

# Pop from queue (blocking)
BRPOP queue:emails 30
# Wait up to 30 seconds for item

# Get list length
LLEN queue:emails
```

### E-commerce Use Cases

| Use Case | Key Pattern | Operations |
|----------|-------------|------------|
| Recently viewed | `recent:viewed:{userId}` | `LPUSH`, `LTRIM` (keep last N) |
| Order history | `orders:{userId}` | `LPUSH`, `LRANGE` |
| Notification queue | `notifications:{userId}` | `RPUSH`, `LPOP` |

### TypeScript Example

```typescript
// Recently viewed products (keep last 10)
const addRecentlyViewed = async (userId: string, productId: string) => {
  const key = `recent:viewed:${userId}`;
  
  // Add to front
  await client.lPush(key, productId);
  
  // Keep only last 10
  await client.lTrim(key, 0, 9);
  
  // Set TTL for cleanup (7 days)
  await client.expire(key, 604800);
};

// Get recently viewed
const getRecentlyViewed = async (userId: string): Promise<string[]> => {
  return await client.lRange(`recent:viewed:${userId}`, 0, 9);
};
```

---

## 4️⃣ Sets

**Unordered collection of unique items.** Perfect for tags, followers, unique visitors.

### Commands

```bash
# Add members
SADD product:123:tags "electronics" "smartphone" "apple"

# Check membership
SISMEMBER product:123:tags "smartphone"
# → 1 (true)

# Get all members
SMEMBERS product:123:tags
# → ["electronics", "smartphone", "apple"]

# Count members
SCARD product:123:tags
# → 3

# Set operations
SADD user:123:following "user:456" "user:789"
SADD user:456:followers "user:123"

# Intersection (mutual follows)
SINTER user:123:following user:456:following
```

### E-commerce Use Cases

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SET USE CASES IN E-COMMERCE                             │
│                                                                              │
│   Unique Daily Visitors:                                                    │
│   ─────────────────────                                                     │
│   visitors:2025-01-05                                                       │
│   └── { "user:123", "user:456", "user:789", ... }                          │
│                                                                              │
│   SCARD visitors:2025-01-05 → 15,234 unique visitors                       │
│                                                                              │
│   Product Tags:                                                             │
│   ─────────────                                                             │
│   tags:electronics → { "product:1", "product:5", "product:9" }             │
│   tags:apple → { "product:1", "product:3" }                                │
│                                                                              │
│   SINTER tags:electronics tags:apple → Apple electronics                   │
│                                                                              │
│   Wishlist:                                                                 │
│   ────────                                                                  │
│   wishlist:user:123 → { "product:456", "product:789" }                     │
│   SISMEMBER wishlist:user:123 "product:456" → Is it in wishlist?           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### TypeScript Example

```typescript
// Track unique visitors per day
const trackVisitor = async (userId: string) => {
  const today = new Date().toISOString().split('T')[0];
  const key = `visitors:${today}`;
  
  // Add to set (automatically deduped)
  await client.sAdd(key, userId);
  
  // Expire at end of day
  await client.expireAt(key, endOfDay());
};

// Get unique visitor count
const getUniqueVisitors = async (date: string): Promise<number> => {
  return await client.sCard(`visitors:${date}`);
};

// Check if product is in wishlist
const isInWishlist = async (userId: string, productId: string): Promise<boolean> => {
  return await client.sIsMember(`wishlist:${userId}`, productId);
};
```

---

## 5️⃣ Sorted Sets (ZSets)

**Like Sets, but with a score for ordering.** Perfect for leaderboards, rankings, priority queues.

### Commands

```bash
# Add with score
ZADD trending:products 100 "product:123"
ZADD trending:products 250 "product:456"
ZADD trending:products 75 "product:789"

# Get top N (highest scores)
ZREVRANGE trending:products 0 9 WITHSCORES
# → [("product:456", 250), ("product:123", 100), ("product:789", 75)]

# Increment score (atomically!)
ZINCRBY trending:products 50 "product:123"
# → 150

# Get rank
ZREVRANK trending:products "product:456"
# → 0 (top position)

# Get by score range
ZRANGEBYSCORE trending:products 100 200
```

### E-commerce Use Cases

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   SORTED SET USE CASES                                       │
│                                                                              │
│   Trending Products (score = views/sales):                                  │
│   ─────────────────────────────────────────                                 │
│   trending:products                                                         │
│   ├── product:456 → 1250 views                                              │
│   ├── product:123 → 980 views                                               │
│   └── product:789 → 756 views                                               │
│                                                                              │
│   Price-based filtering:                                                    │
│   ──────────────────────                                                    │
│   products:by_price                                                         │
│   ├── product:1 → 29.99                                                     │
│   ├── product:2 → 149.99                                                    │
│   └── product:3 → 999.99                                                    │
│                                                                              │
│   ZRANGEBYSCORE products:by_price 0 100 → Products under $100               │
│                                                                              │
│   Search Autocomplete:                                                      │
│   ────────────────────                                                      │
│   autocomplete:iph                                                          │
│   ├── "iPhone 15 Pro" → 1000 (popularity)                                   │
│   ├── "iPhone 15" → 800                                                     │
│   └── "iPhone 14" → 500                                                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### TypeScript Example

```typescript
// Track trending products
const trackProductView = async (productId: string) => {
  // Increment view count as score
  await client.zIncrBy('trending:products:daily', 1, productId);
};

// Get top 10 trending products
const getTrendingProducts = async (): Promise<string[]> => {
  // Get highest scores (most views)
  return await client.zRange('trending:products:daily', 0, 9, {
    REV: true  // Descending order
  });
};

// Get products in price range
const getProductsByPrice = async (min: number, max: number): Promise<string[]> => {
  return await client.zRangeByScore('products:by_price', min, max);
};
```

---

## ⏰ TTL (Time To Live)

Every key can have an expiration. **Critical for caching!**

### Commands

```bash
# Set with expiration
SET session:abc123 "data" EX 3600  # 1 hour in seconds
SET session:abc123 "data" PX 3600000  # 1 hour in milliseconds

# Add expiration to existing key
EXPIRE product:123 300  # 5 minutes
EXPIREAT product:123 1735689600  # Unix timestamp

# Check remaining TTL
TTL product:123
# → 287 (seconds remaining)
# → -1 (no expiration)
# → -2 (key doesn't exist)

# Remove expiration (persist forever)
PERSIST product:123
```

### Best Practices

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TTL BEST PRACTICES                                   │
│                                                                              │
│   Data Type          │ Recommended TTL   │ Why                              │
│   ───────────────────┼───────────────────┼──────────────────────────────    │
│   Product cache      │ 5-15 minutes      │ Balance freshness vs load        │
│   Search results     │ 1-5 minutes       │ Query results change often       │
│   User session       │ 30 min - 24 hours │ Security + convenience           │
│   Rate limit counter │ 1 minute - 1 hour │ Match rate limit window          │
│   Trending data      │ 1-24 hours        │ Daily/hourly trends              │
│   Distributed lock   │ 10-30 seconds     │ Prevent deadlocks                │
│                                                                              │
│   ⚠️  ALWAYS SET TTL ON CACHE DATA!                                         │
│   Without TTL, cache will grow forever and fill memory.                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Your Existing Code Explained

Let's understand your Product Service Redis code:

### redisClient.ts

```typescript
// Creates a singleton Redis client
import { createClient, RedisClientType } from 'redis';

let client: RedisClientType;

const connectRedis = async (url: string) => {
  client = createClient({ url });
  
  client.on('connect', () => {
    console.log('Redis Server connected ~~ 🔥🔥🔥');
  });
  
  client.on('error', (err) => {
    console.error('Redis error: 💥💥💥', err);
  });
  
  await client.connect();
};

// Why singleton? 
// - One connection per service instance
// - Connection pooling handled internally
// - Consistent state across requests
```

### calculateTTL.ts

```typescript
// Helper to convert human-readable time to seconds
export function calculateTTL(value: number, timeUnit: 'seconds' | 'minutes' | 'hours'): number {
  switch (timeUnit) {
    case 'seconds': return value;
    case 'minutes': return value * 60;
    case 'hours': return value * 3600;
    default: throw new Error('Invalid time unit');
  }
}

// Usage: calculateTTL(5, 'minutes') → 300
```

---

## 🧠 Quick Recap

| Data Type | Best For | Key Commands |
|-----------|----------|--------------|
| **String** | Simple values, counters | `GET`, `SET`, `INCR` |
| **Hash** | Objects with fields | `HSET`, `HGET`, `HGETALL` |
| **List** | Queues, recent items | `LPUSH`, `RPOP`, `LRANGE` |
| **Set** | Unique collections | `SADD`, `SISMEMBER`, `SINTER` |
| **Sorted Set** | Rankings, ranges | `ZADD`, `ZRANGE`, `ZINCRBY` |

---

## 📖 Vocabulary

| Term | Definition |
|------|------------|
| **Key** | The identifier for stored data |
| **TTL** | Time To Live - expiration in seconds |
| **Atomic** | Operation completes fully or not at all |
| **Singleton** | Single shared instance |
| **In-memory** | Stored in RAM, not disk |

---

## 🏋️ Exercises

1. **Basic Operations**: Connect to Redis CLI and practice each data type
2. **Your Product Service**: Trace through `showProduct.ts` and identify the caching pattern
3. **Design Exercise**: How would you cache user profiles using a Hash?

---

## ➡️ Next Chapter

[Chapter 2: Caching Patterns](./02-caching-patterns.md) - Learn cache-aside, write-through, and more!

