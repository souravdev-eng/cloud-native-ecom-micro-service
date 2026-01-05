# 📚 Chapter 3: Cache Invalidation

## 🎯 Learning Objectives

By the end of this chapter, you will understand:

- Why cache invalidation is "the hardest problem"
- TTL-based expiration strategies
- Event-driven invalidation
- Pattern-based key deletion

---

## 🤔 Why Is Invalidation Hard?

> "There are only two hard things in Computer Science: cache invalidation and naming things."
> — Phil Karlton

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     THE INVALIDATION DILEMMA                                 │
│                                                                              │
│   Too Aggressive                        Too Passive                         │
│   ──────────────                        ────────────                         │
│                                                                              │
│   Invalidate everything,                Never invalidate,                    │
│   every time                            rely only on TTL                     │
│        │                                      │                              │
│        ▼                                      ▼                              │
│   Cache hit rate: 10%                   Stale data served                   │
│   Database overloaded!                  Angry customers!                    │
│                                                                              │
│   ──────────────────────────────────────────────────────────────────────    │
│                                                                              │
│                        🎯 THE GOAL                                          │
│                                                                              │
│               Invalidate exactly the right data,                            │
│                    at exactly the right time                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1️⃣ TTL-Based Expiration

**The simplest approach:** Set an expiration time, let Redis handle cleanup.

### How It Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        TTL LIFECYCLE                                         │
│                                                                              │
│   Time 0:00                                                                 │
│   SET product:123 "data" EX 300                                             │
│   └── TTL: 300 seconds                                                      │
│                                                                              │
│   Time 2:00 (120 seconds later)                                             │
│   TTL product:123 → 180 seconds remaining                                   │
│                                                                              │
│   Time 5:00 (300 seconds later)                                             │
│   GET product:123 → nil (expired and deleted)                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### TTL Strategies

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      TTL STRATEGY GUIDE                                      │
│                                                                              │
│   Data Type          │ Recommended TTL  │ Reasoning                         │
│   ───────────────────┼──────────────────┼───────────────────────────────    │
│   Product details    │ 5-15 minutes     │ Changes occasionally              │
│   Product prices     │ 1-5 minutes      │ Changes more often                │
│   Search results     │ 1-5 minutes      │ New products added frequently     │
│   User profile       │ 30-60 minutes    │ Rarely changes                    │
│   Homepage content   │ 5-15 minutes     │ Curated, updates periodically     │
│   Inventory count    │ 30 seconds       │ Critical accuracy!                │
│   Session data       │ 30 min - 24 hr   │ Security considerations           │
│   Rate limit counter │ 1 minute         │ Matches rate window               │
│                                                                              │
│   ⚠️  SHORTER TTL = More DB load, Fresher data                              │
│   ⚠️  LONGER TTL = Less DB load, Staler data                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Your Current TTL Implementation

```typescript
// product/src/routes/showProduct.ts
if (shouldCacheResult && product.data.length > 0) {
  // Search results: cache longer (users repeat searches)
  // Regular queries: shorter cache (might browse different pages)
  const ttl = req.query.search 
    ? calculateTTL(60, 'minutes')   // 1 hour for searches
    : calculateTTL(10, 'minutes');  // 10 min for regular queries
    
  await redisClient.set(cacheKey, JSON.stringify(product), { EX: ttl });
}
```

### Advanced TTL: Jitter

**Problem:** All caches expire at the same time → stampede!

```typescript
// BAD: Fixed TTL
const TTL = 300; // 5 minutes

// GOOD: TTL with jitter
function getTTLWithJitter(baseTTL: number, jitterPercent: number = 10): number {
  const jitter = baseTTL * (jitterPercent / 100);
  const randomJitter = Math.random() * jitter * 2 - jitter; // -jitter to +jitter
  return Math.round(baseTTL + randomJitter);
}

// Usage
const ttl = getTTLWithJitter(300, 10); 
// Returns: 270-330 seconds (5 min ± 10%)
```

---

## 2️⃣ Event-Driven Invalidation

**Invalidate cache when data changes.** Most accurate, but requires coordination.

### The Pattern

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    EVENT-DRIVEN INVALIDATION                                 │
│                                                                              │
│   Product Service                                                           │
│        │                                                                     │
│        │ Update product:123                                                 │
│        ▼                                                                     │
│   ┌──────────────┐                                                          │
│   │   Database   │                                                          │
│   └──────────────┘                                                          │
│        │                                                                     │
│        │ Publish: "product.updated" { id: 123 }                             │
│        ▼                                                                     │
│   ┌──────────────┐                                                          │
│   │   RabbitMQ   │ ──────────────┬─────────────────┐                        │
│   └──────────────┘               │                 │                        │
│                                  ▼                 ▼                        │
│                         ┌──────────────┐   ┌──────────────┐                 │
│                         │ Cart Service │   │ Order Service│                 │
│                         │  (listener)  │   │  (listener)  │                 │
│                         └──────────────┘   └──────────────┘                 │
│                                  │                 │                        │
│                                  ▼                 ▼                        │
│                         Invalidate cache   Invalidate cache                 │
│                         for product:123    for product:123                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Implementation

```typescript
// Product Service: Publish on update
// product/src/routes/updateProduct.ts
router.put('/api/product/:id', async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  
  // Invalidate local cache
  await redisClient.del(`product:${product.id}`);
  
  // Publish event for other services
  await rabbitMQWrapper.channel.publish(
    'product-exchange',
    'product.updated',
    Buffer.from(JSON.stringify({
      id: product.id,
      action: 'updated',
      timestamp: new Date().toISOString()
    }))
  );
  
  res.status(200).send(product);
});

// Other Services: Listen and invalidate
// cart/src/queues/productUpdatedListener.ts
class ProductUpdatedListener {
  async onMessage(data: { id: string; action: string }) {
    // Invalidate any cached data related to this product
    await redisClient.del(`product:${data.id}`);
    
    // Also invalidate cart entries that contain this product
    const pattern = `cart:*:product:${data.id}`;
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    
    console.log(`Cache invalidated for product ${data.id}`);
  }
}
```

### Using Redis Pub/Sub for Real-time Invalidation

```typescript
// Publisher (Product Service)
const publishInvalidation = async (productId: string) => {
  await redisClient.publish('cache-invalidation', JSON.stringify({
    type: 'product',
    id: productId,
    action: 'invalidate'
  }));
};

// Subscriber (Any service that caches products)
const subscribeToInvalidations = async () => {
  const subscriber = redisClient.duplicate();
  await subscriber.connect();
  
  await subscriber.subscribe('cache-invalidation', (message) => {
    const { type, id, action } = JSON.parse(message);
    
    if (type === 'product' && action === 'invalidate') {
      // Invalidate local cache
      redisClient.del(`product:${id}`);
      redisClient.del(`product_search:*`); // Also clear search caches
    }
  });
};
```

---

## 3️⃣ Pattern-Based Deletion

**Delete multiple keys matching a pattern.** Useful for invalidating related caches.

### The KEYS Command (Use Carefully!)

```bash
# Find all keys matching pattern
KEYS product_search:*
# → ["product_search:abc123", "product_search:def456", ...]

# ⚠️ WARNING: KEYS is blocking and slow on large datasets!
# DON'T use in production with millions of keys
```

### Better: SCAN Command

```bash
# Non-blocking iteration
SCAN 0 MATCH product_search:* COUNT 100
# → Returns cursor and batch of keys

# Keep scanning until cursor is 0
```

### TypeScript Implementation

```typescript
// Safe pattern deletion using SCAN
async function deleteByPattern(pattern: string): Promise<number> {
  let cursor = 0;
  let deletedCount = 0;
  
  do {
    // Scan for keys matching pattern
    const result = await redisClient.scan(cursor, {
      MATCH: pattern,
      COUNT: 100
    });
    
    cursor = result.cursor;
    const keys = result.keys;
    
    if (keys.length > 0) {
      await redisClient.del(keys);
      deletedCount += keys.length;
    }
  } while (cursor !== 0);
  
  return deletedCount;
}

// Usage examples
await deleteByPattern('product:*');           // All product caches
await deleteByPattern('product_search:*');    // All search caches
await deleteByPattern('cart:user:456:*');     // All cart items for user
```

### Organized Key Naming for Easy Invalidation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   KEY NAMING CONVENTIONS                                     │
│                                                                              │
│   Pattern: {service}:{type}:{id}:{subtype}                                  │
│                                                                              │
│   Examples:                                                                 │
│   ─────────                                                                 │
│   product:item:123                   # Single product                       │
│   product:search:abc123def           # Search result cache                  │
│   product:category:electronics       # Category listing                     │
│   product:trending:daily             # Daily trending                       │
│                                                                              │
│   cart:user:456                      # User's cart                          │
│   cart:user:456:item:123             # Specific cart item                   │
│                                                                              │
│   user:profile:789                   # User profile                         │
│   user:session:abc123                # User session                         │
│                                                                              │
│   Benefits:                                                                 │
│   ─────────                                                                 │
│   • product:* → All product caches                                         │
│   • product:search:* → All search caches                                   │
│   • cart:user:456:* → All cart data for user 456                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4️⃣ Tag-Based Invalidation

**Group related caches with tags.** Invalidate all caches with a specific tag.

### Implementation Using Sets

```typescript
class TaggedCache {
  private redis: RedisClientType;

  // Store data with tags
  async setWithTags(
    key: string, 
    value: string, 
    tags: string[], 
    ttl: number
  ): Promise<void> {
    // Store the actual data
    await this.redis.set(key, value, { EX: ttl });
    
    // Add key to each tag's set
    for (const tag of tags) {
      await this.redis.sAdd(`tag:${tag}`, key);
      // Set TTL on tag set slightly longer than data
      await this.redis.expire(`tag:${tag}`, ttl + 60);
    }
  }

  // Invalidate all keys with a tag
  async invalidateTag(tag: string): Promise<number> {
    const keys = await this.redis.sMembers(`tag:${tag}`);
    
    if (keys.length === 0) return 0;
    
    // Delete all tagged keys
    await this.redis.del(keys);
    
    // Delete the tag set itself
    await this.redis.del(`tag:${tag}`);
    
    return keys.length;
  }

  // Example usage
  async cacheProductSearch(searchId: string, products: Product[]): Promise<void> {
    const key = `search:${searchId}`;
    const productIds = products.map(p => p.id);
    
    // Tag with each product ID so we can invalidate when any product changes
    const tags = [
      'search-results',
      ...productIds.map(id => `product:${id}`)
    ];
    
    await this.setWithTags(key, JSON.stringify(products), tags, 300);
  }
}

// When product 123 is updated:
const taggedCache = new TaggedCache();
await taggedCache.invalidateTag('product:123');
// This invalidates ALL search results that included product 123!
```

---

## 5️⃣ Invalidation Strategies Comparison

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 INVALIDATION STRATEGY COMPARISON                             │
│                                                                              │
│   Strategy       │ Freshness │ Complexity │ Use Case                        │
│   ───────────────┼───────────┼────────────┼──────────────────────────────   │
│   TTL Only       │ ⭐⭐      │ ⭐         │ Data that can be stale           │
│   Event-Driven   │ ⭐⭐⭐⭐⭐│ ⭐⭐⭐     │ Critical data, microservices     │
│   Pattern Delete │ ⭐⭐⭐    │ ⭐⭐       │ Bulk invalidation                │
│   Tag-Based      │ ⭐⭐⭐⭐  │ ⭐⭐⭐     │ Complex relationships            │
│                                                                              │
│   RECOMMENDED COMBINATION:                                                  │
│   ─────────────────────────                                                 │
│   TTL (safety net) + Event-Driven (immediate) + Pattern Delete (bulk)       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Practical Example: Product Update Flow

```typescript
// Complete invalidation flow for product update
async function updateProduct(id: string, data: UpdateProductDTO): Promise<Product> {
  // 1. Update database
  const product = await productRepo.update(id, data);
  
  // 2. Invalidate direct cache
  await redis.del(`product:${id}`);
  
  // 3. Invalidate related search caches (pattern-based)
  await deleteByPattern('product_search:*');
  
  // 4. Invalidate category caches if category changed
  if (data.category) {
    await redis.del(`category:${data.category}:products`);
    await redis.del(`category:${product.oldCategory}:products`);
  }
  
  // 5. Publish event for other services
  await rabbitMQ.publish('product.updated', {
    id: product.id,
    changes: Object.keys(data),
    timestamp: new Date()
  });
  
  // 6. Optionally pre-populate cache (write-through)
  await redis.set(`product:${id}`, JSON.stringify(product), { EX: 300 });
  
  return product;
}
```

---

## 🧠 Quick Recap

| Strategy | When to Use | Pros | Cons |
|----------|-------------|------|------|
| **TTL** | Always (as safety net) | Simple, automatic | Data can be stale |
| **Event-Driven** | Microservices | Immediate, accurate | Complex setup |
| **Pattern Delete** | Bulk operations | Powerful | Can be slow |
| **Tag-Based** | Complex relationships | Precise | Memory overhead |

---

## 🏋️ Exercises

1. **Add TTL jitter**: Modify your cache code to add ±10% jitter
2. **Event listener**: Create a RabbitMQ listener to invalidate caches on product updates
3. **Pattern cleanup**: Write a scheduled job to clean up orphaned cache keys

---

## ➡️ Next Chapter

[Chapter 4: Distributed Locks](./04-distributed-locks.md) - Prevent race conditions in flash sales!

