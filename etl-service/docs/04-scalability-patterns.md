# 📚 Chapter 4: Scalability Patterns for ETL

## 🎯 Learning Objectives

By the end of this chapter, you will understand:

- How to scale ETL processes for millions of records
- Horizontal vs vertical scaling strategies
- Partitioning and parallelization techniques
- Memory management for large datasets
- Real-world scaling patterns used by major companies

---

## 📈 The Scalability Challenge

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SCALING CHALLENGES                                │
│                                                                      │
│   Today:        1,000 products    → ETL runs in 5 seconds           │
│   Next month:   100,000 products  → ETL runs in 8 minutes           │
│   Next year:    10,000,000 products → ??? (Hours? Days?)            │
│                                                                      │
│   As data grows, simple approaches break down!                      │
│                                                                      │
│   Problems at scale:                                                │
│   ├── Memory exhaustion (can't load all data)                      │
│   ├── Timeout errors (queries too slow)                            │
│   ├── Network bottlenecks (too much data transfer)                 │
│   ├── Database locks (blocking other operations)                   │
│   └── Single point of failure (one error kills everything)         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Pattern 1: Batch Processing (What We Use)

### Current Implementation

```typescript
// Process in chunks instead of all at once
for (let i = 0; i < missingProducts.length; i += batchSize) {
  const batch = missingProducts.slice(i, i + batchSize);
  await productRepository.save(batch);
  await this.delay(100);
}
```

### Why It Works

```
┌─────────────────────────────────────────────────────────────────────┐
│               BATCH PROCESSING BENEFITS                              │
│                                                                      │
│   MEMORY USAGE                                                      │
│   ────────────                                                      │
│   All at once:  Load 1M products = 500MB RAM at once               │
│   In batches:   Load 100 products = 50KB RAM at a time             │
│                                                                      │
│   100 products ──┐                                                  │
│                  ├──▶ Process ──▶ Free memory ──┐                  │
│   100 products ──┘                              │                  │
│                  ├──▶ Process ──▶ Free memory ──┤                  │
│   100 products ──┘                              │                  │
│                  ...continues...                 │                  │
│                                                  ▼                  │
│                                          Memory stays low!          │
│                                                                      │
│   DATABASE LOAD                                                     │
│   ─────────────                                                     │
│   All at once:  INSERT 1M rows = Database locked for minutes       │
│   In batches:   INSERT 100 rows = Quick inserts, others can query  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Choosing the Right Batch Size

```
┌─────────────────────────────────────────────────────────────────────┐
│                 BATCH SIZE SELECTION                                 │
│                                                                      │
│   Size    │ Pros                    │ Cons                         │
│   ───────────────────────────────────────────────────────────────   │
│   10      │ Low memory, quick fail  │ Too many DB calls           │
│   50      │ Fast recovery           │ Still inefficient           │
│   100 ✅  │ Good balance            │ Works for most cases        │
│   500     │ Fewer DB calls          │ Longer per-batch time       │
│   1000    │ Very efficient          │ Memory concerns             │
│   10000   │ Maximum efficiency      │ Timeout/memory issues       │
│                                                                      │
│   FORMULA for optimal batch size:                                   │
│   ──────────────────────────────                                    │
│   Consider:                                                         │
│   • Row size (small rows → larger batches OK)                      │
│   • Transaction timeout (large batches must complete in time)      │
│   • Memory available (don't exceed heap limit)                     │
│   • Concurrent users (smaller batches = less DB blocking)          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Pattern 2: Streaming (For Very Large Datasets)

### When to Use

When data is too large to fit in memory, even in batches.

### Concept

```
┌─────────────────────────────────────────────────────────────────────┐
│                    STREAMING vs BATCHING                             │
│                                                                      │
│   BATCHING (Our current approach)                                   │
│   ────────────────────────────────                                  │
│   1. Fetch ALL products from MongoDB into memory                   │
│   2. Then process in batches                                        │
│                                                                      │
│   Problem: With 10M products, step 1 loads 5GB into memory!        │
│                                                                      │
│   STREAMING (For massive datasets)                                  │
│   ─────────────────────────────────                                 │
│   1. Fetch products one page at a time using cursor                │
│   2. Process each page before fetching next                        │
│                                                                      │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐                     │
│   │ Page 1   │───▶│ Process  │───▶│ Page 2   │───▶...              │
│   │(100 items)│   │ & Write  │    │(100 items)│                     │
│   └──────────┘    └──────────┘    └──────────┘                     │
│                                                                      │
│   Memory usage stays constant regardless of total data size!        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Implementation Example

```typescript
// Streaming approach for massive datasets
static async syncProductsStreaming(): Promise<SyncResult> {
    const batchSize = 100;
    let processed = 0;
    let synced = 0;

    // Use MongoDB cursor - doesn't load everything at once
    const cursor = MongoProduct.find({}).cursor();

    let batch: ProductDoc[] = [];

    for await (const product of cursor) {
        batch.push(product);

        if (batch.length >= batchSize) {
            // Process this batch
            const targetIds = await this.getExistingIds(batch.map(p => p.id));
            const missing = batch.filter(p => !targetIds.has(p.id));

            if (missing.length > 0) {
                await this.insertBatch(missing);
                synced += missing.length;
            }

            processed += batch.length;
            batch = [];  // Clear batch, free memory

            // Progress update
            console.log(`Processed: ${processed}, Synced: ${synced}`);
        }
    }

    // Don't forget the last partial batch!
    if (batch.length > 0) {
        // ... process remaining items
    }

    return { processed, synced };
}
```

---

## 🔄 Pattern 3: Parallel Processing

### Current: Sequential Processing

```typescript
// Processes one batch at a time
for (let i = 0; i < batches.length; i++) {
  await processBatch(batches[i]); // Wait for each batch
}
// Total time: batch1 + batch2 + batch3 + ...
```

### Improved: Parallel Processing

```typescript
// Process multiple batches simultaneously
const PARALLEL_WORKERS = 4;

async function processInParallel(items: any[], batchSize: number) {
  const batches = chunkArray(items, batchSize);

  // Process 4 batches at a time
  for (let i = 0; i < batches.length; i += PARALLEL_WORKERS) {
    const currentBatches = batches.slice(i, i + PARALLEL_WORKERS);

    // All 4 run at the same time!
    await Promise.all(currentBatches.map((batch) => processBatch(batch)));
  }
}
// Total time: (batch1 || batch2 || batch3 || batch4) + ...
// Roughly 4x faster!
```

### Visualization

```
┌─────────────────────────────────────────────────────────────────────┐
│                 SEQUENTIAL vs PARALLEL                               │
│                                                                      │
│   SEQUENTIAL (One at a time)                                        │
│   ──────────────────────────                                        │
│   Time: ──────────────────────────────────────────────────────▶     │
│   Worker 1: [Batch 1][Batch 2][Batch 3][Batch 4][Batch 5]...       │
│   Worker 2: (idle)                                                  │
│   Worker 3: (idle)                                                  │
│   Worker 4: (idle)                                                  │
│                                                                      │
│   PARALLEL (4 workers)                                              │
│   ────────────────────                                              │
│   Time: ──────────────────────────────▶                             │
│   Worker 1: [Batch 1][Batch 5][Batch 9]...                         │
│   Worker 2: [Batch 2][Batch 6][Batch 10]...                        │
│   Worker 3: [Batch 3][Batch 7][Batch 11]...                        │
│   Worker 4: [Batch 4][Batch 8][Batch 12]...                        │
│                                                                      │
│   ⚡ ~4x faster total execution time!                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Caution: Database Connection Limits

```typescript
// Don't spawn too many parallel operations!
const MAX_PARALLEL = Math.min(
  parseInt(process.env.PARALLEL_WORKERS || '4'),
  10 // Never more than 10 to avoid connection exhaustion
);
```

---

## 🔄 Pattern 4: Partitioning (Sharding)

### Concept

Split data by a key to process subsets independently.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DATA PARTITIONING                                 │
│                                                                      │
│   ALL DATA (1 million products)                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  Products A-Z (all mixed together)                          │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│   PARTITIONED BY CATEGORY                                           │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│   │  Phones  │  │ Laptops  │  │ Fashion  │  │  Books   │           │
│   │ (50,000) │  │ (30,000) │  │(200,000) │  │(100,000) │           │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
│        ▼              ▼              ▼              ▼               │
│   [ETL Worker 1] [ETL Worker 2] [ETL Worker 3] [ETL Worker 4]      │
│                                                                      │
│   Benefits:                                                         │
│   ✅ Each partition is smaller (faster to process)                 │
│   ✅ Partitions can run in parallel                                │
│   ✅ Failure in one partition doesn't affect others                │
│   ✅ Can prioritize important partitions                           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Implementation Example

```typescript
// Partition by seller ID
static async syncProductsBySeller(): Promise<void> {
    // Get unique sellers
    const sellers = await MongoProduct.distinct('sellerId');

    // Process each seller's products independently
    for (const sellerId of sellers) {
        console.log(`Syncing products for seller: ${sellerId}`);

        await this.syncProductsForSeller(sellerId);
    }
}

static async syncProductsForSeller(sellerId: string): Promise<SyncResult> {
    // Only fetch this seller's products
    const sourceProducts = await MongoProduct.find({ sellerId });
    const targetProducts = await CartProductRepo.find({ where: { sellerId } });

    // Rest of sync logic...
}
```

### Partition Strategies

| Strategy        | Use When                | Example                            |
| --------------- | ----------------------- | ---------------------------------- |
| **By ID Range** | IDs are sequential      | Products 1-10000, 10001-20000, ... |
| **By Hash**     | Need even distribution  | `productId.hashCode() % 4`         |
| **By Category** | Natural grouping exists | Phones, Electronics, Fashion       |
| **By Date**     | Time-series data        | Today, This Week, This Month       |
| **By Region**   | Geographic distribution | US, EU, APAC                       |

---

## 🔄 Pattern 5: Checkpointing

### Problem

What if ETL crashes halfway through?

```
┌─────────────────────────────────────────────────────────────────────┐
│                    THE CRASH PROBLEM                                 │
│                                                                      │
│   Without checkpointing:                                            │
│   ──────────────────────                                            │
│   [Batch 1] ✓ [Batch 2] ✓ [Batch 3] ✓ [Batch 4] 💥 CRASH           │
│                                                                      │
│   Restart: Start from Batch 1 again!                               │
│   - Re-processes 3 batches (wasted work)                           │
│   - May create duplicates                                          │
│                                                                      │
│   With checkpointing:                                               │
│   ────────────────────                                              │
│   [Batch 1] ✓ [Save: completed=1]                                  │
│   [Batch 2] ✓ [Save: completed=2]                                  │
│   [Batch 3] ✓ [Save: completed=3]                                  │
│   [Batch 4] 💥 CRASH                                               │
│                                                                      │
│   Restart: Read checkpoint (completed=3), start from Batch 4!      │
│   ✅ No wasted work                                                 │
│   ✅ No duplicates                                                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Implementation Example

```typescript
interface Checkpoint {
  lastProcessedId: string;
  processedCount: number;
  startedAt: Date;
  updatedAt: Date;
}

class CheckpointedSync {
  static async syncWithCheckpoint(): Promise<void> {
    // Load last checkpoint
    let checkpoint = await this.loadCheckpoint();

    // Resume from where we left off
    const query = checkpoint ? { _id: { $gt: checkpoint.lastProcessedId } } : {};

    const cursor = MongoProduct.find(query).sort({ _id: 1 }).cursor();

    let batch: ProductDoc[] = [];
    let lastId = checkpoint?.lastProcessedId || '';

    for await (const product of cursor) {
      batch.push(product);
      lastId = product.id;

      if (batch.length >= 100) {
        await this.processBatch(batch);

        // Save checkpoint after each batch
        await this.saveCheckpoint({
          lastProcessedId: lastId,
          processedCount: (checkpoint?.processedCount || 0) + batch.length,
          startedAt: checkpoint?.startedAt || new Date(),
          updatedAt: new Date(),
        });

        batch = [];
      }
    }

    // Clear checkpoint when complete
    await this.clearCheckpoint();
  }
}
```

---

## 🔄 Pattern 6: Dead Letter Queue (DLQ)

### Concept

Failed items go to a special queue for retry/investigation.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DEAD LETTER QUEUE                                 │
│                                                                      │
│   Normal Flow                                                       │
│   ───────────                                                       │
│   [Product 1] ──▶ Transform ──▶ Load ──▶ ✅ Success                │
│   [Product 2] ──▶ Transform ──▶ Load ──▶ ✅ Success                │
│   [Product 3] ──▶ Transform ──▶ Load ──▶ ❌ Failed!                │
│                                              │                      │
│                                              ▼                      │
│   Dead Letter Queue                                                 │
│   ┌─────────────────────────────────────────────────────────┐      │
│   │  { product: Product3, error: "Duplicate key", time: t } │      │
│   │  { product: Product7, error: "Timeout", time: t }       │      │
│   │  { product: Product9, error: "Invalid data", time: t }  │      │
│   └─────────────────────────────────────────────────────────┘      │
│                              │                                      │
│                              ▼                                      │
│   Later: Retry or investigate failed items                         │
│                                                                      │
│   Benefits:                                                         │
│   ✅ Main process continues (doesn't block on errors)              │
│   ✅ Failed items preserved for analysis                           │
│   ✅ Can retry failures separately                                 │
│   ✅ Track error patterns over time                                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Scaling Strategy Cheatsheet

```
┌─────────────────────────────────────────────────────────────────────┐
│               WHEN TO USE WHICH PATTERN                              │
│                                                                      │
│   Data Size        │ Recommended Patterns                           │
│   ─────────────────────────────────────────────────────────────────  │
│   < 10,000         │ Simple batching (current approach) ✓           │
│   10K - 100K       │ Parallel processing + batching                 │
│   100K - 1M        │ Streaming + partitioning + checkpoints         │
│   1M - 10M         │ Distributed workers + message queues           │
│   > 10M            │ Apache Spark / Flink / dedicated ETL tools     │
│                                                                      │
│   Current Service: Optimized for ~100K records                      │
│   (Can scale further with additional patterns)                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Quick Wins for Current Service

### 1. Add Parallel Batch Processing

```typescript
// Process 4 batches simultaneously
const WORKERS = 4;
const batchChunks = chunk(batches, WORKERS);
for (const group of batchChunks) {
  await Promise.all(group.map((b) => processBatch(b)));
}
```

### 2. Add Index on IDs

```sql
-- In Cart Service PostgreSQL
CREATE INDEX idx_product_id ON product(id);

-- In MongoDB
db.products.createIndex({ _id: 1 });
```

### 3. Use UPSERT Instead of Check-Then-Insert

```typescript
// Instead of: check if exists → insert if not
// Use: upsert (insert or update)
await productRepository.upsert(cartProduct, ['id']);
```

---

## 🧠 Key Takeaways

| Concept               | What It Does                  | When to Use                |
| --------------------- | ----------------------------- | -------------------------- |
| **Batching**          | Process in chunks             | Always (basic requirement) |
| **Streaming**         | Process without loading all   | Data > available memory    |
| **Parallel**          | Multiple simultaneous workers | CPU/IO bound work          |
| **Partitioning**      | Divide by logical key         | Need isolation/priority    |
| **Checkpointing**     | Save progress                 | Long-running jobs          |
| **Dead Letter Queue** | Preserve failures             | Production systems         |

---

## ➡️ Next Chapter

[Chapter 5: Distributed Systems Fundamentals](./05-distributed-systems.md)
