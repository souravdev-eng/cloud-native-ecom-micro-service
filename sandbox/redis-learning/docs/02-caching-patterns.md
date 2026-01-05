# 📚 Chapter 2: Caching Patterns

## 🎯 Learning Objectives

By the end of this chapter, you will understand:

- The three main caching patterns
- When to use each pattern
- How your Product Service implements cache-aside
- Trade-offs between consistency and performance

---

## 🤔 Why Caching Patterns Matter

Without a proper pattern, caching becomes chaotic:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    THE CACHING CHAOS PROBLEM                                 │
│                                                                              │
│   Without patterns:                   With patterns:                        │
│   ─────────────────                   ──────────────                        │
│                                                                              │
│   • Where do I cache?                 • Clear responsibilities              │
│   • When do I update cache?           • Predictable behavior                │
│   • What if cache is stale?           • Easy debugging                      │
│   • What if cache fails?              • Consistent data                     │
│                                                                              │
│   Result: Bugs, stale data,           Result: Reliable, fast,               │
│   inconsistent state                  maintainable system                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 The Three Main Patterns

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CACHING PATTERNS OVERVIEW                              │
│                                                                              │
│   1. CACHE-ASIDE (Lazy Loading)         ◀── YOUR PRODUCT SERVICE USES THIS │
│   ──────────────────────────────                                            │
│   App checks cache → Miss? → Load from DB → Store in cache                  │
│                                                                              │
│   2. WRITE-THROUGH                                                          │
│   ────────────────                                                          │
│   Write to cache AND database simultaneously                                │
│                                                                              │
│   3. WRITE-BEHIND (Write-Back)                                              │
│   ────────────────────────────                                              │
│   Write to cache immediately, sync to DB asynchronously                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1️⃣ Cache-Aside Pattern (Lazy Loading)

**The most common pattern.** Application manages cache explicitly.

### How It Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CACHE-ASIDE FLOW                                      │
│                                                                              │
│   READ REQUEST:                                                             │
│   ─────────────                                                             │
│                                                                              │
│   Client ──▶ Application ──▶ Check Cache                                    │
│                                   │                                          │
│                    ┌──────────────┴──────────────┐                          │
│                    ▼                             ▼                          │
│               CACHE HIT                     CACHE MISS                      │
│                    │                             │                          │
│                    │                             ▼                          │
│                    │                      Query Database                    │
│                    │                             │                          │
│                    │                             ▼                          │
│                    │                      Store in Cache                    │
│                    │                             │                          │
│                    └──────────────┬──────────────┘                          │
│                                   ▼                                          │
│                           Return to Client                                  │
│                                                                              │
│   WRITE REQUEST:                                                            │
│   ──────────────                                                            │
│                                                                              │
│   Client ──▶ Application ──▶ Write to Database ──▶ Invalidate Cache        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Your Product Service Implementation

```typescript
// product/src/routes/showProduct.ts
router.get('/api/product', requireAuth, async (req, res) => {
  // Step 1: Should we cache this request?
  const shouldCacheResult = shouldCache(req.query);
  let cacheKey = '';

  if (shouldCacheResult) {
    // Step 2: Generate cache key
    cacheKey = generateSearchCacheKey(req.query);
    
    // Step 3: Check cache
    const cachedProduct = await redisClient.get(cacheKey);

    // Step 4: CACHE HIT - Return immediately
    if (cachedProduct) {
      res.status(200).send(JSON.parse(cachedProduct));
      return;
    }
  }

  // Step 5: CACHE MISS - Query database
  const productApiFeature = new ProductAPIFeature(Product.find({}), req.query)
    .filter()
    .sort()
    .search()
    .limitFields()
    .paginate();

  const product = await productApiFeature.executePaginated();

  // Step 6: Store in cache for next time
  if (shouldCacheResult && product.data.length > 0) {
    const ttl = req.query.search 
      ? calculateTTL(60, 'minutes')   // Search results: 1 hour
      : calculateTTL(10, 'minutes');  // Regular queries: 10 min
    await redisClient.set(cacheKey, JSON.stringify(product), { EX: ttl });
  }

  res.status(200).send(product);
});
```

### Pros and Cons

| Pros | Cons |
|------|------|
| ✅ Only cache what's needed | ❌ Cache miss = slow first request |
| ✅ Cache failure doesn't break app | ❌ Data can be stale until TTL |
| ✅ Simple to understand | ❌ Cache stampede risk |
| ✅ Works with any database | ❌ Manual invalidation needed |

### When to Use

- **Read-heavy workloads** (product catalog, user profiles)
- **Data that tolerates slight staleness**
- **Unpredictable access patterns** (can't pre-warm)

---

## 2️⃣ Write-Through Pattern

**Update cache AND database together.** Ensures cache is always fresh.

### How It Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      WRITE-THROUGH FLOW                                      │
│                                                                              │
│   WRITE REQUEST:                                                            │
│   ──────────────                                                            │
│                                                                              │
│   Client ──▶ Application ──┬──▶ Write to Cache                              │
│                            │                                                 │
│                            └──▶ Write to Database                           │
│                                       │                                      │
│                                       ▼                                      │
│                               Both succeed? ──▶ Return Success              │
│                                                                              │
│   READ REQUEST:                                                             │
│   ─────────────                                                             │
│                                                                              │
│   Client ──▶ Application ──▶ Read from Cache ──▶ Return                     │
│                                                                              │
│   (Cache is ALWAYS up-to-date, so DB read not needed!)                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Implementation Example

```typescript
// Write-through caching for products
class ProductService {
  private redis: RedisClientType;
  private productRepo: ProductRepository;

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    // Step 1: Update database
    const product = await this.productRepo.update(id, data);
    
    // Step 2: Update cache (synchronously)
    await this.redis.set(
      `product:${id}`,
      JSON.stringify(product),
      { EX: 3600 }  // 1 hour TTL
    );
    
    // Step 3: Also invalidate any search caches that might include this product
    await this.invalidateSearchCaches(product);
    
    return product;
  }

  async getProduct(id: string): Promise<Product | null> {
    // Cache is always fresh, so check cache first
    const cached = await this.redis.get(`product:${id}`);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Fallback to DB (for first access or cache eviction)
    const product = await this.productRepo.findById(id);
    
    if (product) {
      await this.redis.set(`product:${id}`, JSON.stringify(product), { EX: 3600 });
    }
    
    return product;
  }

  async createProduct(data: CreateProductDTO): Promise<Product> {
    // Create in DB
    const product = await this.productRepo.create(data);
    
    // Immediately cache
    await this.redis.set(
      `product:${product.id}`,
      JSON.stringify(product),
      { EX: 3600 }
    );
    
    return product;
  }

  async deleteProduct(id: string): Promise<void> {
    // Delete from DB
    await this.productRepo.delete(id);
    
    // Delete from cache
    await this.redis.del(`product:${id}`);
    
    // Invalidate search caches
    await this.invalidateSearchCaches({ id });
  }
}
```

### Pros and Cons

| Pros | Cons |
|------|------|
| ✅ Cache always consistent | ❌ Write latency increased |
| ✅ Read always fast | ❌ Cache failures can block writes |
| ✅ No stale data | ❌ Writes more complex |
| ✅ Simpler read logic | ❌ May cache unused data |

### When to Use

- **Write-light, read-heavy workloads**
- **Data consistency is critical** (inventory counts!)
- **Known access patterns** (popular products)

---

## 3️⃣ Write-Behind Pattern (Write-Back)

**Write to cache immediately, sync to DB asynchronously.** Fastest writes.

### How It Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      WRITE-BEHIND FLOW                                       │
│                                                                              │
│   WRITE REQUEST:                                                            │
│   ──────────────                                                            │
│                                                                              │
│   Client ──▶ Application ──▶ Write to Cache ──▶ Return Success (FAST!)     │
│                                   │                                          │
│                                   ▼                                          │
│                           Add to Write Queue                                │
│                                   │                                          │
│                                   ▼                                          │
│                     Background Worker (async)                               │
│                                   │                                          │
│                                   ▼                                          │
│                         Write to Database                                   │
│                                                                              │
│   ⚠️  DANGER: Data loss possible if cache fails before DB sync!            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Implementation Example

```typescript
// Write-behind caching (advanced pattern)
import { Queue, Worker } from 'bullmq';

class WriteBehindCache {
  private redis: RedisClientType;
  private writeQueue: Queue;
  private productRepo: ProductRepository;

  constructor() {
    // Queue for async DB writes
    this.writeQueue = new Queue('db-writes', {
      connection: { host: 'localhost', port: 6379 }
    });

    // Worker processes queue
    new Worker('db-writes', async (job) => {
      const { operation, id, data } = job.data;
      
      switch (operation) {
        case 'update':
          await this.productRepo.update(id, data);
          break;
        case 'create':
          await this.productRepo.create(data);
          break;
        case 'delete':
          await this.productRepo.delete(id);
          break;
      }
    }, {
      connection: { host: 'localhost', port: 6379 }
    });
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    // Step 1: Update cache immediately (FAST!)
    const product = { id, ...data, updatedAt: new Date() };
    await this.redis.set(`product:${id}`, JSON.stringify(product), { EX: 3600 });
    
    // Step 2: Queue DB write (async)
    await this.writeQueue.add('update-product', {
      operation: 'update',
      id,
      data
    }, {
      attempts: 3,  // Retry on failure
      backoff: { type: 'exponential', delay: 1000 }
    });
    
    return product;  // Return immediately!
  }
}
```

### Pros and Cons

| Pros | Cons |
|------|------|
| ✅ Extremely fast writes | ❌ Risk of data loss |
| ✅ DB can be slower | ❌ Complex failure handling |
| ✅ Batch writes possible | ❌ Eventual consistency |
| ✅ Good for high throughput | ❌ Harder to debug |

### When to Use

- **Extremely high write throughput** (analytics, logs)
- **Data loss is acceptable** (view counts, temp data)
- **Backend can't keep up** with write rate

---

## 📊 Pattern Comparison

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CACHING PATTERN DECISION MATRIX                           │
│                                                                              │
│   Pattern        │ Read Speed │ Write Speed │ Consistency │ Complexity      │
│   ───────────────┼────────────┼─────────────┼─────────────┼──────────────   │
│   Cache-Aside    │ Fast*      │ Fast        │ Eventual    │ Low             │
│   Write-Through  │ Fast       │ Slower      │ Strong      │ Medium          │
│   Write-Behind   │ Fast       │ Very Fast   │ Eventual    │ High            │
│                                                                              │
│   * After first access (cache miss is slow)                                 │
│                                                                              │
│   YOUR E-COMMERCE RECOMMENDATIONS:                                          │
│   ──────────────────────────────────                                        │
│   • Product catalog → Cache-Aside (what you have!)                          │
│   • Inventory counts → Write-Through (consistency!)                         │
│   • View counts → Write-Behind (high throughput)                            │
│   • User sessions → Cache-Aside or Write-Through                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚨 Common Problems & Solutions

### 1. Cache Stampede (Thundering Herd)

**Problem:** When cache expires, many requests hit the database simultaneously.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CACHE STAMPEDE                                       │
│                                                                              │
│   Cache expires at 12:00:00                                                 │
│                                                                              │
│   12:00:00.001 ──▶ Request 1 ──▶ Cache miss ──▶ DB query                   │
│   12:00:00.002 ──▶ Request 2 ──▶ Cache miss ──▶ DB query                   │
│   12:00:00.003 ──▶ Request 3 ──▶ Cache miss ──▶ DB query                   │
│   ...                                                                        │
│   12:00:00.050 ──▶ Request 50 ──▶ Cache miss ──▶ DB query                  │
│                                                                              │
│   💥 50 identical DB queries! Database overloaded!                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Solution:** Lock-based refresh

```typescript
async function getProductWithLock(productId: string): Promise<Product> {
  const cacheKey = `product:${productId}`;
  const lockKey = `lock:${cacheKey}`;
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  // Try to acquire lock
  const acquired = await redis.set(lockKey, '1', { NX: true, EX: 10 });
  
  if (acquired) {
    try {
      // We got the lock, fetch from DB
      const product = await productRepo.findById(productId);
      await redis.set(cacheKey, JSON.stringify(product), { EX: 300 });
      return product;
    } finally {
      await redis.del(lockKey);
    }
  } else {
    // Someone else is refreshing, wait and retry
    await sleep(100);
    return getProductWithLock(productId);
  }
}
```

### 2. Stale Data After Update

**Problem:** User updates product, but old data served from cache.

**Solution:** Explicit invalidation on writes

```typescript
async function updateProduct(id: string, data: UpdateProductDTO) {
  // Update DB
  const product = await productRepo.update(id, data);
  
  // Invalidate cache
  await redis.del(`product:${id}`);
  
  // Also invalidate search caches that might include this product
  await redis.del(`product_search:*`);  // Pattern delete
  
  return product;
}
```

### 3. Cache and DB Out of Sync

**Problem:** Cache update succeeds, DB update fails (or vice versa).

**Solution:** Delete cache, not update (for cache-aside)

```typescript
// BAD: Update both
async function updateProduct(id: string, data: UpdateProductDTO) {
  await redis.set(`product:${id}`, JSON.stringify(data));  // What if DB fails?
  await productRepo.update(id, data);
}

// GOOD: Delete cache, let it refresh
async function updateProduct(id: string, data: UpdateProductDTO) {
  await productRepo.update(id, data);  // DB first
  await redis.del(`product:${id}`);    // Then invalidate
  // Next read will repopulate cache with fresh data
}
```

---

## 🎯 Implementing Write-Through in Your Product Service

Here's how to add write-through caching for product updates:

```typescript
// product/src/routes/updateProduct.ts
router.put('/api/product/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  // Validate
  const validatedData = productValidation.parse(updates);
  
  // Update database
  const product = await Product.findByIdAndUpdate(id, validatedData, { new: true });
  
  if (!product) {
    throw new NotFoundError('Product not found');
  }
  
  // Update cache (write-through)
  const cacheKey = `product:${id}`;
  await redisClient.set(cacheKey, JSON.stringify(product), {
    EX: calculateTTL(1, 'hours')
  });
  
  // Invalidate search caches (they might include old data)
  const searchKeys = await redisClient.keys('product_search:*');
  if (searchKeys.length > 0) {
    await redisClient.del(searchKeys);
  }
  
  // Publish event for other services
  await rabbitMQWrapper.channel.publish(
    'product-exchange',
    'product.updated',
    Buffer.from(JSON.stringify(product))
  );
  
  res.status(200).send(product);
});
```

---

## 🧠 Quick Recap

| Pattern | Cache Population | Cache Update | Best For |
|---------|------------------|--------------|----------|
| **Cache-Aside** | On first read | Invalidate on write | General purpose |
| **Write-Through** | On write | Immediate | Consistency-critical |
| **Write-Behind** | On write | Async to DB | High write throughput |

---

## 🏋️ Exercises

1. **Trace your code**: Follow a request through `showProduct.ts` and identify each cache-aside step
2. **Add write-through**: Modify `updateProduct.ts` to update cache on product updates
3. **Measure impact**: Add logging to track cache hit rate

---

## ➡️ Next Chapter

[Chapter 3: Cache Invalidation](./03-cache-invalidation.md) - The hardest problem in computer science!

