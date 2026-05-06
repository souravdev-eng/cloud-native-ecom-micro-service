# 📚 Chapter 6: Testing & Debugging ETL Pipelines

## 🎯 Learning Objectives

By the end of this chapter, you will understand:

- How to test ETL pipelines effectively
- Common debugging techniques
- Monitoring and observability practices
- How to verify data integrity

---

## 🧪 Testing Strategies

### The Testing Pyramid for ETL

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ETL TESTING PYRAMID                               │
│                                                                      │
│                         ▲                                           │
│                        ╱ ╲      End-to-End Tests                    │
│                       ╱   ╲     (Few - Expensive)                   │
│                      ╱  E2E ╲   Test full pipeline                  │
│                     ╱───────╲   with real databases                 │
│                    ╱         ╲                                      │
│                   ╱ Integration╲  Integration Tests                 │
│                  ╱─────────────╲ (Some - Moderate)                  │
│                 ╱               ╲ Test with in-memory DBs           │
│                ╱                 ╲                                  │
│               ╱    Unit Tests     ╲  Unit Tests                     │
│              ╱─────────────────────╲ (Many - Cheap)                 │
│             ╱                       ╲ Test functions in isolation   │
│            ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔                              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Unit Testing

### What to Unit Test

```typescript
// Test transformation logic
describe('Product Transformation', () => {
  it('should convert ObjectId to string', () => {
    const mongoProduct = {
      _id: new ObjectId('507f1f77bcf86cd799439011'),
      title: 'iPhone 15',
      price: 999,
      sellerId: new ObjectId('507f1f77bcf86cd799439012'),
    };

    const cartProduct = transformProduct(mongoProduct);

    expect(typeof cartProduct.id).toBe('string');
    expect(typeof cartProduct.sellerId).toBe('string');
  });

  it('should set default quantity if missing', () => {
    const mongoProduct = {
      title: 'Test',
      price: 100,
      quantity: undefined, // Missing!
    };

    const cartProduct = transformProduct(mongoProduct);

    expect(cartProduct.quantity).toBe(0); // Default applied
  });
});
```

### Test the Identification Algorithm

```typescript
describe('Missing Product Identification', () => {
  it('should identify products missing in target', () => {
    const source = [
      { id: 'A', title: 'Product A' },
      { id: 'B', title: 'Product B' },
      { id: 'C', title: 'Product C' },
    ];

    const target = [
      { id: 'A', title: 'Product A' },
      // B is missing!
      { id: 'C', title: 'Product C' },
    ];

    const missing = identifyMissingProducts(source, target);

    expect(missing).toHaveLength(1);
    expect(missing[0].id).toBe('B');
  });

  it('should return empty array when in sync', () => {
    const source = [{ id: 'A' }, { id: 'B' }];
    const target = [{ id: 'A' }, { id: 'B' }];

    const missing = identifyMissingProducts(source, target);

    expect(missing).toHaveLength(0);
  });

  it('should handle empty source', () => {
    const missing = identifyMissingProducts([], [{ id: 'A' }]);
    expect(missing).toHaveLength(0);
  });
});
```

---

## 🔗 Integration Testing

### Setup with In-Memory Databases

```typescript
// test/setup.ts
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clear all collections before each test
  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
});
```

### Test the Full Sync Process

```typescript
describe('ProductSyncService Integration', () => {
  beforeEach(async () => {
    // Setup: Create test products in "source" MongoDB
    await Product.create([
      { title: 'Product A', price: 100, sellerId: 'seller1' },
      { title: 'Product B', price: 200, sellerId: 'seller1' },
      { title: 'Product C', price: 300, sellerId: 'seller2' },
    ]);
  });

  it('should sync all products when target is empty', async () => {
    const result = await ProductSyncService.syncProducts({
      batchSize: 10,
      dryRun: false,
    });

    expect(result.totalProductsInSource).toBe(3);
    expect(result.missingProducts).toBe(3);
    expect(result.syncedProducts).toBe(3);
    expect(result.errors).toHaveLength(0);
  });

  it('should not sync in dry run mode', async () => {
    const result = await ProductSyncService.syncProducts({
      dryRun: true,
    });

    expect(result.missingProducts).toBe(3);
    expect(result.syncedProducts).toBe(0); // Nothing synced!
  });

  it('should only sync missing products', async () => {
    // Pre-populate target with one product
    await insertIntoTarget({ id: 'productA', title: 'Product A' });

    const result = await ProductSyncService.syncProducts({
      batchSize: 10,
    });

    expect(result.totalProductsInSource).toBe(3);
    expect(result.missingProducts).toBe(2); // Only B and C missing
    expect(result.syncedProducts).toBe(2);
  });
});
```

---

## ✅ Validation Testing

### Test Data Integrity

```typescript
describe('Validation', () => {
  it('should report valid when databases are in sync', async () => {
    // Setup: Same data in both
    const products = [
      { id: 'A', title: 'Product A' },
      { id: 'B', title: 'Product B' },
    ];
    await seedSource(products);
    await seedTarget(products);

    const validation = await ProductSyncService.validateSync();

    expect(validation.isValid).toBe(true);
    expect(validation.details.missingInTarget).toBe(0);
  });

  it('should report invalid when data is missing', async () => {
    await seedSource([{ id: 'A' }, { id: 'B' }, { id: 'C' }]);
    await seedTarget([{ id: 'A' }]); // Missing B and C

    const validation = await ProductSyncService.validateSync();

    expect(validation.isValid).toBe(false);
    expect(validation.details.missingInTarget).toBe(2);
    expect(validation.details.missingProductIds).toContain('B');
    expect(validation.details.missingProductIds).toContain('C');
  });
});
```

---

## 🔍 Debugging Techniques

### 1. Structured Logging

```typescript
// Good: Structured, searchable logs
console.log('Sync started', {
  timestamp: new Date().toISOString(),
  batchSize: options.batchSize,
  dryRun: options.dryRun,
});

console.log('Batch processed', {
  batchNumber: Math.floor(i / batchSize) + 1,
  itemsInBatch: batch.length,
  totalProcessed: i + batch.length,
  totalItems: missingProducts.length,
});

// Bad: Unstructured logs
console.log('Starting sync...');
console.log('Processed batch');
```

### 2. Debug Flags

```typescript
const DEBUG = process.env.DEBUG_ETL === 'true';

if (DEBUG) {
  console.log('DEBUG: Source products:', sourceProducts);
  console.log('DEBUG: Target products:', targetProducts);
  console.log('DEBUG: Missing products:', missingProducts);
}
```

### 3. Dry Run for Investigation

```bash
# See what WOULD be synced without making changes
curl -X POST http://localhost:4000/api/etl/sync \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true}'
```

### 4. Database Query Debugging

```typescript
// Enable TypeORM query logging in development
this.postgresConnection = new DataSource({
  type: 'postgres',
  url: process.env.CART_DB_URL,
  logging: process.env.NODE_ENV === 'development', // Shows SQL queries
});
```

---

## 📊 Monitoring & Observability

### Health Check Endpoint

```
┌─────────────────────────────────────────────────────────────────────┐
│                    HEALTH CHECK RESPONSE                             │
│                                                                      │
│   GET /api/etl/health                                               │
│                                                                      │
│   {                                                                  │
│     "status": "healthy",                                            │
│     "timestamp": "2024-01-15T10:30:00Z",                           │
│     "service": "etl-service",                                       │
│     "version": "1.0.0",                                             │
│     "uptime": 3600,                                                 │
│     "connections": {                                                │
│       "productMongodb": true,    ← Source DB connected             │
│       "orderMongodb": true,      ← Target MongoDB connected        │
│       "postgresql": true         ← Target Postgres connected        │
│     },                                                              │
│     "memory": {                                                     │
│       "used": 45.23,             ← MB used                         │
│       "total": 128.00            ← MB allocated                    │
│     }                                                               │
│   }                                                                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Metrics to Track

```
┌─────────────────────────────────────────────────────────────────────┐
│                    IMPORTANT METRICS                                 │
│                                                                      │
│   Sync Performance                                                  │
│   ────────────────                                                  │
│   • Duration: How long does each sync take?                        │
│   • Records synced: How many products moved?                       │
│   • Batch time: Average time per batch                             │
│                                                                      │
│   Data Health                                                       │
│   ───────────                                                       │
│   • Missing count: Products in source but not target               │
│   • Extra count: Products in target but not source                 │
│   • Sync delta: Difference between source and target counts        │
│                                                                      │
│   System Health                                                     │
│   ─────────────                                                     │
│   • Memory usage: Are we leaking memory?                           │
│   • Connection pool: Are connections available?                    │
│   • Error rate: How often do syncs fail?                           │
│   • Last successful sync: When did we last sync successfully?      │
│                                                                      │
│   Scheduler Status                                                  │
│   ────────────────                                                  │
│   • Is scheduler running?                                          │
│   • Next scheduled run time                                        │
│   • Is a sync currently in progress?                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Adding Custom Metrics

```typescript
// Track sync metrics
interface SyncMetrics {
  lastSyncTime: Date | null;
  lastSyncDuration: number;
  totalSyncsCompleted: number;
  totalSyncsFailed: number;
  totalRecordsSynced: number;
}

class MetricsCollector {
  private static metrics: SyncMetrics = {
    lastSyncTime: null,
    lastSyncDuration: 0,
    totalSyncsCompleted: 0,
    totalSyncsFailed: 0,
    totalRecordsSynced: 0,
  };

  static recordSyncComplete(duration: number, recordsSynced: number) {
    this.metrics.lastSyncTime = new Date();
    this.metrics.lastSyncDuration = duration;
    this.metrics.totalSyncsCompleted++;
    this.metrics.totalRecordsSynced += recordsSynced;
  }

  static recordSyncFailed() {
    this.metrics.totalSyncsFailed++;
  }

  static getMetrics(): SyncMetrics {
    return { ...this.metrics };
  }
}
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Out of Memory

```
┌─────────────────────────────────────────────────────────────────────┐
│   SYMPTOM: Node.js heap out of memory error                        │
│                                                                      │
│   CAUSE: Loading too many records at once                          │
│                                                                      │
│   SOLUTION:                                                         │
│   ├── Reduce batch size                                            │
│   ├── Use streaming instead of loading all                         │
│   └── Increase Node.js memory limit                                │
│                                                                      │
│   # Increase memory limit                                          │
│   NODE_OPTIONS="--max-old-space-size=4096" npm start               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Issue 2: Duplicate Records

```
┌─────────────────────────────────────────────────────────────────────┐
│   SYMPTOM: Same record appears multiple times in target            │
│                                                                      │
│   CAUSE: ETL ran concurrently, or unique constraint missing        │
│                                                                      │
│   SOLUTION:                                                         │
│   ├── Add unique constraint on ID                                  │
│   ├── Use UPSERT instead of INSERT                                 │
│   └── Ensure only one sync runs at a time (isRunning flag)        │
│                                                                      │
│   -- Add unique constraint                                         │
│   ALTER TABLE product ADD CONSTRAINT unique_id UNIQUE (id);        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Issue 3: Slow Sync Performance

```
┌─────────────────────────────────────────────────────────────────────┐
│   SYMPTOM: Sync takes hours instead of minutes                     │
│                                                                      │
│   CAUSES & SOLUTIONS:                                               │
│                                                                      │
│   1. Missing indexes                                                │
│      └── Add indexes on ID columns                                 │
│                                                                      │
│   2. Too small batch size                                          │
│      └── Increase batch size (100 → 500)                          │
│                                                                      │
│   3. Network latency                                                │
│      └── Run ETL closer to databases (same region)                │
│                                                                      │
│   4. Inefficient queries                                            │
│      └── Use projection to select only needed fields               │
│          MongoProduct.find({}, 'id title price image sellerId')   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Issue 4: Connection Timeouts

```
┌─────────────────────────────────────────────────────────────────────┐
│   SYMPTOM: "Connection timeout" errors                              │
│                                                                      │
│   SOLUTIONS:                                                        │
│   ├── Increase connection timeout                                  │
│   ├── Add connection pooling                                       │
│   ├── Check network connectivity                                   │
│   └── Verify database is not overloaded                            │
│                                                                      │
│   // Increase timeout                                              │
│   mongoose.connect(url, {                                          │
│       serverSelectionTimeoutMS: 30000,  // 30 seconds             │
│       socketTimeoutMS: 45000,           // 45 seconds             │
│   });                                                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Pre-Production Checklist

```
┌─────────────────────────────────────────────────────────────────────┐
│                 ETL PRODUCTION CHECKLIST                             │
│                                                                      │
│   ☐ Unit tests pass                                                │
│   ☐ Integration tests pass                                         │
│   ☐ Dry run tested with production-like data                      │
│   ☐ Health check endpoint works                                    │
│   ☐ Readiness/liveness probes configured                          │
│   ☐ Logging is structured and comprehensive                        │
│   ☐ Error handling covers all failure modes                        │
│   ☐ Batch size optimized for data volume                          │
│   ☐ Database indexes created                                       │
│   ☐ Connection pooling configured                                  │
│   ☐ Graceful shutdown implemented                                  │
│   ☐ Scheduler schedule reviewed                                    │
│   ☐ Alerting configured for failures                              │
│   ☐ Runbook written for common issues                             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🧠 Key Takeaways

| Area                  | What to Do                                 |
| --------------------- | ------------------------------------------ |
| **Unit Tests**        | Test transformations, identification logic |
| **Integration Tests** | Test with in-memory databases              |
| **Validation**        | Verify data integrity after sync           |
| **Logging**           | Structured, searchable logs                |
| **Monitoring**        | Track duration, counts, errors             |
| **Debugging**         | Use dry run, enable query logging          |

---

## ➡️ Next Chapter

[Chapter 7: Production Best Practices](./07-production-best-practices.md)
