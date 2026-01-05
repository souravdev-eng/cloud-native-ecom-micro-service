# 📚 Chapter 4: Distributed Locks

## 🎯 Learning Objectives

By the end of this chapter, you will understand:

- What distributed locks are and why you need them
- How to implement locks with Redis
- The Redlock algorithm for high availability
- Preventing deadlocks and handling failures

---

## 🤔 Why Distributed Locks?

**Problem:** Multiple service instances can modify the same data simultaneously.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    THE RACE CONDITION PROBLEM                                │
│                                                                              │
│   Flash Sale: Only 10 iPhones in stock!                                     │
│                                                                              │
│   Time      Instance 1              Instance 2              Stock           │
│   ────      ──────────              ──────────              ─────           │
│   0ms       Read stock: 10                                  10              │
│   1ms                               Read stock: 10          10              │
│   2ms       Check: 10 > 0 ✓                                 10              │
│   3ms                               Check: 10 > 0 ✓         10              │
│   4ms       Decrement: 10-1=9                               9               │
│   5ms                               Decrement: 10-1=9       9               │
│   6ms       Write: 9                                        9               │
│   7ms                               Write: 9                9               │
│                                                                              │
│   ❌ PROBLEM: Two orders placed, but stock only decreased by 1!             │
│   Customer 2 bought an item that doesn't exist!                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Solution:** Use a distributed lock to ensure only one process can modify data at a time.

---

## 1️⃣ Basic Redis Lock (SETNX)

The simplest lock using Redis's atomic `SET NX` (Set if Not eXists).

### How It Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        BASIC LOCK FLOW                                       │
│                                                                              │
│   ACQUIRE LOCK:                                                             │
│   ─────────────                                                             │
│   SET lock:order:123 "instance-1" NX EX 10                                  │
│       │                                                                      │
│       ├── NX: Only set if key doesn't exist                                 │
│       └── EX 10: Auto-expire in 10 seconds (deadlock prevention)            │
│                                                                              │
│   Returns:                                                                  │
│   • "OK" → Lock acquired! Proceed with operation                            │
│   • nil → Lock held by another process, wait or fail                        │
│                                                                              │
│   RELEASE LOCK:                                                             │
│   ─────────────                                                             │
│   DEL lock:order:123                                                        │
│   (Only the lock owner should release!)                                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Implementation

```typescript
class SimpleRedisLock {
  private redis: RedisClientType;
  
  constructor(redis: RedisClientType) {
    this.redis = redis;
  }

  /**
   * Acquire a lock
   * @returns Lock token if acquired, null if lock is held
   */
  async acquire(
    lockName: string, 
    ttlSeconds: number = 10
  ): Promise<string | null> {
    const token = crypto.randomUUID(); // Unique identifier
    
    const result = await this.redis.set(
      `lock:${lockName}`,
      token,
      { NX: true, EX: ttlSeconds }
    );
    
    return result === 'OK' ? token : null;
  }

  /**
   * Release a lock (only if we own it)
   */
  async release(lockName: string, token: string): Promise<boolean> {
    // Lua script for atomic check-and-delete
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    
    const result = await this.redis.eval(script, {
      keys: [`lock:${lockName}`],
      arguments: [token]
    });
    
    return result === 1;
  }
}
```

### Why Use a Token?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    WHY LOCK TOKENS MATTER                                    │
│                                                                              │
│   WITHOUT TOKEN (Dangerous!):                                               │
│   ──────────────────────────                                                │
│   Instance A: Acquires lock                                                 │
│   Instance A: Takes too long... lock expires!                               │
│   Instance B: Acquires lock (legitimate)                                    │
│   Instance A: Finishes, calls DEL lock                                      │
│   ❌ Instance A deleted Instance B's lock!                                  │
│                                                                              │
│   WITH TOKEN (Safe):                                                        │
│   ─────────────────                                                         │
│   Instance A: Acquires lock with token "abc123"                             │
│   Instance A: Takes too long... lock expires!                               │
│   Instance B: Acquires lock with token "xyz789"                             │
│   Instance A: Tries to release with token "abc123"                          │
│   ✅ Redis checks: "xyz789" != "abc123", release denied!                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2️⃣ Using Locks in E-commerce

### Flash Sale / Inventory Lock

```typescript
class InventoryService {
  private lock: SimpleRedisLock;
  private redis: RedisClientType;

  async purchaseItem(productId: string, quantity: number, userId: string): Promise<PurchaseResult> {
    const lockName = `inventory:${productId}`;
    const lockToken = await this.lock.acquire(lockName, 30); // 30 second timeout
    
    if (!lockToken) {
      return { 
        success: false, 
        error: 'Item is being purchased by another customer, please try again' 
      };
    }
    
    try {
      // Critical section - only one process at a time!
      
      // 1. Check inventory
      const product = await this.productRepo.findById(productId);
      if (product.quantity < quantity) {
        return { success: false, error: 'Insufficient stock' };
      }
      
      // 2. Decrement inventory
      await this.productRepo.decrementQuantity(productId, quantity);
      
      // 3. Create order
      const order = await this.orderRepo.create({
        userId,
        productId,
        quantity,
        status: 'pending'
      });
      
      // 4. Process payment (if this fails, we need compensation!)
      try {
        await this.paymentService.charge(userId, product.price * quantity);
        await this.orderRepo.updateStatus(order.id, 'confirmed');
      } catch (paymentError) {
        // Compensation: rollback inventory
        await this.productRepo.incrementQuantity(productId, quantity);
        await this.orderRepo.updateStatus(order.id, 'failed');
        return { success: false, error: 'Payment failed' };
      }
      
      return { success: true, orderId: order.id };
      
    } finally {
      // ALWAYS release the lock!
      await this.lock.release(lockName, lockToken);
    }
  }
}
```

### Preventing Duplicate Order Processing

```typescript
class OrderProcessor {
  async processOrder(orderId: string): Promise<void> {
    const lockName = `order-processing:${orderId}`;
    const lockToken = await this.lock.acquire(lockName, 60);
    
    if (!lockToken) {
      console.log(`Order ${orderId} is already being processed`);
      return;
    }
    
    try {
      // Check if already processed (idempotency)
      const order = await this.orderRepo.findById(orderId);
      if (order.status !== 'pending') {
        console.log(`Order ${orderId} already processed: ${order.status}`);
        return;
      }
      
      // Process the order...
      await this.fulfillOrder(order);
      
    } finally {
      await this.lock.release(lockName, lockToken);
    }
  }
}
```

---

## 3️⃣ Lock with Retry

Sometimes you want to wait for a lock instead of failing immediately.

```typescript
class RedisLockWithRetry {
  private redis: RedisClientType;

  async acquireWithRetry(
    lockName: string,
    options: {
      ttlSeconds?: number;
      maxRetries?: number;
      retryDelayMs?: number;
    } = {}
  ): Promise<string | null> {
    const {
      ttlSeconds = 10,
      maxRetries = 5,
      retryDelayMs = 200
    } = options;

    let retries = 0;
    
    while (retries < maxRetries) {
      const token = crypto.randomUUID();
      
      const result = await this.redis.set(
        `lock:${lockName}`,
        token,
        { NX: true, EX: ttlSeconds }
      );
      
      if (result === 'OK') {
        return token;
      }
      
      // Wait before retry with exponential backoff + jitter
      const delay = retryDelayMs * Math.pow(2, retries) + Math.random() * 100;
      await this.sleep(delay);
      retries++;
    }
    
    return null; // Failed to acquire after all retries
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

## 4️⃣ Redlock Algorithm (High Availability)

**Problem:** What if your single Redis instance fails?

**Solution:** Redlock acquires locks across multiple independent Redis instances.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       REDLOCK ALGORITHM                                      │
│                                                                              │
│   5 Independent Redis Instances:                                            │
│                                                                              │
│   ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                         │
│   │Redis1│  │Redis2│  │Redis3│  │Redis4│  │Redis5│                         │
│   └──────┘  └──────┘  └──────┘  └──────┘  └──────┘                         │
│      ✅        ✅        ✅        ❌        ❌                              │
│                                                                              │
│   Lock acquired on 3/5 instances = SUCCESS (majority!)                      │
│                                                                              │
│   Algorithm:                                                                │
│   ──────────                                                                │
│   1. Get current timestamp                                                  │
│   2. Try to acquire lock on ALL instances sequentially                      │
│   3. If majority (N/2+1) acquired AND time < TTL, lock is valid            │
│   4. If failed, release locks on all instances                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Using Redlock (redlock package)

```typescript
import Redlock from 'redlock';
import { createClient } from 'redis';

// Create multiple independent Redis clients
const redisClients = [
  createClient({ url: 'redis://redis1:6379' }),
  createClient({ url: 'redis://redis2:6379' }),
  createClient({ url: 'redis://redis3:6379' }),
  createClient({ url: 'redis://redis4:6379' }),
  createClient({ url: 'redis://redis5:6379' }),
];

// Connect all clients
await Promise.all(redisClients.map(client => client.connect()));

// Create Redlock instance
const redlock = new Redlock(redisClients, {
  driftFactor: 0.01,  // Clock drift factor
  retryCount: 10,     // Max retry attempts
  retryDelay: 200,    // Time between retries (ms)
  retryJitter: 100,   // Random jitter added to retries
  automaticExtensionThreshold: 500  // Auto-extend lock if operation takes long
});

// Usage
async function flashSalePurchase(productId: string) {
  let lock;
  
  try {
    // Acquire lock (throws if unable)
    lock = await redlock.acquire(
      [`lock:inventory:${productId}`],
      10000  // 10 second TTL
    );
    
    // Critical section
    const product = await Product.findById(productId);
    if (product.quantity <= 0) {
      throw new Error('Out of stock');
    }
    
    await Product.decrementQuantity(productId);
    await Order.create({ productId, status: 'confirmed' });
    
  } catch (error) {
    if (error instanceof Redlock.LockError) {
      console.log('Could not acquire lock');
    }
    throw error;
  } finally {
    // Always release!
    if (lock) {
      await lock.release();
    }
  }
}
```

### Extending Locks

For long-running operations:

```typescript
async function longRunningTask(taskId: string) {
  const lock = await redlock.acquire([`lock:task:${taskId}`], 30000);
  
  try {
    for (const item of largeDataset) {
      // Process item...
      
      // Extend lock if needed (every 10 seconds)
      lock = await lock.extend(30000);
    }
  } finally {
    await lock.release();
  }
}
```

---

## 5️⃣ Best Practices

### Lock Key Naming

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      LOCK KEY CONVENTIONS                                    │
│                                                                              │
│   Pattern: lock:{resource-type}:{resource-id}                               │
│                                                                              │
│   Examples:                                                                 │
│   ─────────                                                                 │
│   lock:inventory:product-123          # Inventory lock                      │
│   lock:order:order-456                # Order processing lock               │
│   lock:user:789:balance               # User balance lock                   │
│   lock:checkout:cart-abc              # Checkout process lock               │
│   lock:payment:txn-xyz                # Payment transaction lock            │
│                                                                              │
│   Bad examples:                                                             │
│   ─────────────                                                             │
│   lock:all-products                   # Too broad!                          │
│   mylock                              # Not descriptive                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### TTL Guidelines

```typescript
const LOCK_TTLS = {
  // Quick operations
  INVENTORY_CHECK: 5,      // 5 seconds
  CACHE_REFRESH: 10,       // 10 seconds
  
  // Medium operations
  ORDER_PROCESSING: 30,    // 30 seconds
  PAYMENT_PROCESSING: 60,  // 60 seconds
  
  // Long operations
  BATCH_PROCESSING: 300,   // 5 minutes (with extension!)
  DATA_MIGRATION: 600,     // 10 minutes (with extension!)
};
```

### Error Handling

```typescript
async function safeLockedOperation<T>(
  lockName: string,
  operation: () => Promise<T>,
  options: { ttl?: number; onLockFailed?: () => T } = {}
): Promise<T> {
  const { ttl = 10, onLockFailed } = options;
  
  const lockToken = await lock.acquire(lockName, ttl);
  
  if (!lockToken) {
    if (onLockFailed) {
      return onLockFailed();
    }
    throw new Error(`Failed to acquire lock: ${lockName}`);
  }
  
  try {
    return await operation();
  } finally {
    const released = await lock.release(lockName, lockToken);
    if (!released) {
      console.warn(`Lock ${lockName} may have expired before release`);
    }
  }
}

// Usage
const result = await safeLockedOperation(
  'inventory:123',
  async () => {
    // Critical operation
    return await purchaseItem('123', 1);
  },
  {
    ttl: 30,
    onLockFailed: () => ({ success: false, error: 'Please try again' })
  }
);
```

---

## 🚨 Common Pitfalls

### 1. Forgetting to Release Locks

```typescript
// BAD: Lock might never be released
async function badExample() {
  const token = await lock.acquire('mylock');
  const result = await riskyOperation(); // If this throws, lock stays!
  await lock.release('mylock', token);
}

// GOOD: Always use try/finally
async function goodExample() {
  const token = await lock.acquire('mylock');
  try {
    return await riskyOperation();
  } finally {
    await lock.release('mylock', token);
  }
}
```

### 2. TTL Too Short

```typescript
// BAD: Operation takes longer than TTL
async function badTTL() {
  const token = await lock.acquire('mylock', 5); // 5 seconds
  await operationThatTakes10Seconds(); // Lock expired mid-operation!
  await lock.release('mylock', token);
}

// GOOD: TTL with buffer, or use extension
async function goodTTL() {
  const token = await lock.acquire('mylock', 30); // 30 seconds buffer
  await operationThatTakes10Seconds();
  await lock.release('mylock', token);
}
```

### 3. Locking Too Broadly

```typescript
// BAD: Locks all inventory
await lock.acquire('lock:inventory');

// GOOD: Lock specific item
await lock.acquire(`lock:inventory:${productId}`);
```

---

## 🧠 Quick Recap

| Aspect | Recommendation |
|--------|----------------|
| **Basic Lock** | Use SETNX with token and TTL |
| **High Availability** | Use Redlock with 5 instances |
| **TTL** | Set 2-3x expected operation time |
| **Release** | Always use try/finally |
| **Key Naming** | `lock:{resource}:{id}` |

---

## 🏋️ Exercises

1. **Implement basic lock**: Create a lock for your order processing
2. **Test race conditions**: Simulate concurrent purchases with the same lock
3. **Add Redlock**: Set up multiple Redis instances and implement Redlock

---

## ➡️ Next Chapter

[Chapter 5: Rate Limiting](./05-rate-limiting.md) - Protect your APIs from abuse!

