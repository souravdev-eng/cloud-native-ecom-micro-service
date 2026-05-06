# 📚 Chapter 5: Distributed Systems Fundamentals

## 🎯 Learning Objectives

By the end of this chapter, you will understand:

- Core challenges of distributed systems
- How ETL fits into microservices architecture
- Consistency, availability, and partition tolerance (CAP)
- Event-driven architecture vs ETL
- Practical patterns for data synchronization

---

## 🌐 What Are Distributed Systems?

A **distributed system** is a collection of independent computers that appears to users as a single coherent system.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MONOLITH vs DISTRIBUTED                           │
│                                                                      │
│   MONOLITH (Single System)                                          │
│   ────────────────────────                                          │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                    One Big Application                       │   │
│   │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐         │   │
│   │  │ Products│  │  Carts  │  │ Orders  │  │  Users  │         │   │
│   │  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘         │   │
│   │       └────────────┴────────────┴────────────┘               │   │
│   │                         │                                    │   │
│   │                    One Database                              │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│   DISTRIBUTED (Our E-commerce System)                               │
│   ────────────────────────────────────                              │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐     │
│   │ Product  │    │   Cart   │    │  Order   │    │   Auth   │     │
│   │ Service  │    │ Service  │    │ Service  │    │ Service  │     │
│   │          │    │          │    │          │    │          │     │
│   │ MongoDB  │    │Postgres  │    │ MongoDB  │    │ MongoDB  │     │
│   └──────────┘    └──────────┘    └──────────┘    └──────────┘     │
│        │               │               │               │            │
│        └───────────────┴───────────────┴───────────────┘            │
│                              │                                       │
│                     Network (Can Fail!)                             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## ⚠️ The Fundamental Challenges

### Challenge 1: Network Failures

```
┌─────────────────────────────────────────────────────────────────────┐
│                    NETWORK IS UNRELIABLE                             │
│                                                                      │
│   Things that can go wrong:                                         │
│                                                                      │
│   Product Service ──────────✗─────────▶ Cart Service               │
│                    Network Failure                                   │
│                                                                      │
│   ├── 🔌 Connection lost                                            │
│   ├── ⏱️ Timeout (no response)                                     │
│   ├── 📡 Packet loss                                                │
│   ├── 🐢 Slow response                                              │
│   └── 🔄 Message delivered twice                                    │
│                                                                      │
│   THE RULE: In distributed systems, assume the network WILL fail.   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Challenge 2: Partial Failures

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PARTIAL FAILURE                                   │
│                                                                      │
│   What happened?                                                    │
│                                                                      │
│   Cart Service ─────[Add Product]─────▶ ?????                       │
│                                                                      │
│   Possibilities:                                                    │
│   ├── Product Service received message, processed, replied ✓       │
│   │   But reply got lost                                            │
│   ├── Product Service received message, crashed during processing  │
│   │   (State unknown)                                               │
│   ├── Product Service never received message                        │
│   │   (Cart thinks it sent, Product never got)                      │
│   └── Message is still in transit                                   │
│       (Will eventually arrive... maybe)                             │
│                                                                      │
│   THE PROBLEM: We don't know which one happened!                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Challenge 3: No Global Clock

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TIME IS RELATIVE                                  │
│                                                                      │
│   Server A (NYC):      10:00:00.000                                 │
│   Server B (London):   10:00:00.150                                 │
│   Server C (Tokyo):    10:00:00.037                                 │
│                                                                      │
│   Even with NTP sync, clocks drift by milliseconds!                │
│                                                                      │
│   Scenario:                                                         │
│   ─────────                                                         │
│   Server A: Updates product price at 10:00:00.000                  │
│   Server B: Also updates price at 10:00:00.050                     │
│                                                                      │
│   Which update wins? Depends on which server you ask!              │
│                                                                      │
│   THE RULE: Don't rely on timestamps for ordering events.          │
│             Use logical clocks or version numbers instead.          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔺 The CAP Theorem

The CAP theorem states that a distributed system can only guarantee 2 of these 3 properties:

```
┌─────────────────────────────────────────────────────────────────────┐
│                      CAP THEOREM                                     │
│                                                                      │
│                        Consistency (C)                               │
│                             △                                        │
│                            /│\                                       │
│                           / │ \                                      │
│                          /  │  \                                     │
│                         /   │   \                                    │
│                        /    │    \                                   │
│                       /     │     \                                  │
│                      /      │      \                                 │
│     Availability (A) ◀─────────────▶ Partition Tolerance (P)        │
│                                                                      │
│   C = Every read receives the most recent write                     │
│   A = Every request receives a response                             │
│   P = System operates despite network partitions                    │
│                                                                      │
│   Reality: Network partitions WILL happen (P is mandatory)          │
│   Choice:  Pick C or A when partition occurs                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Our System's Choice

```
┌─────────────────────────────────────────────────────────────────────┐
│                 OUR TRADE-OFF: AP (Availability + Partition)         │
│                                                                      │
│   We choose AVAILABILITY over strict CONSISTENCY                    │
│                                                                      │
│   Why?                                                              │
│   ─────                                                             │
│   E-commerce priority: Users can always shop!                       │
│                                                                      │
│   ├── Users can browse products (even if slightly outdated)        │
│   ├── Users can add to cart (even if product just changed)         │
│   ├── System stays up during network issues                        │
│   └── Eventual consistency is acceptable                            │
│                                                                      │
│   ETL service is our CONSISTENCY mechanism:                         │
│   ─────────────────────────────────────────                         │
│   It eventually syncs data to restore consistency!                  │
│                                                                      │
│   Timeline:                                                         │
│   [Product updated] → [Cart outdated] → [ETL runs] → [Consistent]  │
│        t=0              t=5 min           t=30 min      t=31 min    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📨 Event-Driven Architecture + ETL

### How Events Work in Our System

```
┌─────────────────────────────────────────────────────────────────────┐
│                 EVENT-DRIVEN ARCHITECTURE                            │
│                                                                      │
│   Normal Operation (Events via RabbitMQ)                            │
│   ──────────────────────────────────────                            │
│                                                                      │
│   Product Service                 Cart Service                       │
│        │                              │                             │
│        │  [ProductCreated Event]      │                             │
│        │──────────────────────────────▶                             │
│        │                              │                             │
│        │  [ProductUpdated Event]      │                             │
│        │──────────────────────────────▶                             │
│        │                              │                             │
│                                                                      │
│   ✅ Real-time updates (milliseconds latency)                       │
│   ✅ Decoupled services                                             │
│   ✅ Scales well                                                    │
│                                                                      │
│   BUT... What if Cart Service is DOWN during an event?              │
│                                                                      │
│        │  [ProductCreated Event]      │                             │
│        │──────────────────────────────▶ 💀 DOWN                    │
│        │                              │                             │
│                                                                      │
│   MESSAGE LOST! Cart never receives the product.                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### ETL as the Safety Net

```
┌─────────────────────────────────────────────────────────────────────┐
│                 ETL: THE CONSISTENCY BACKUP                          │
│                                                                      │
│   Events: Fast but can be lost                                      │
│   ETL:    Slow but guarantees consistency                           │
│                                                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                     Event Bus (RabbitMQ)                     │   │
│   │                                                              │   │
│   │   Product ─────[ProductCreated]─────▶ Cart                  │   │
│   │   Service      (real-time, ~10ms)    Service                │   │
│   │                                                              │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                              ▲                                       │
│                              │  If event lost...                    │
│                              │                                       │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                      ETL Service                             │   │
│   │                                                              │   │
│   │   Product ─────[Batch Compare]──────▶ Cart                  │   │
│   │   MongoDB      (every 30 min)       Postgres                │   │
│   │                                                              │   │
│   │   "What's in Product but not in Cart? → Sync it!"          │   │
│   │                                                              │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│   Together: Real-time + Batch = Eventually Consistent System        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Consistency Patterns

### Pattern 1: Eventual Consistency (What We Use)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    EVENTUAL CONSISTENCY                              │
│                                                                      │
│   Definition: Given enough time without updates, all replicas       │
│               will eventually hold the same value.                  │
│                                                                      │
│   Timeline:                                                         │
│   ─────────                                                         │
│   T=0:  Product created in Product Service                         │
│   T=1s: Event published to RabbitMQ                                │
│   T=2s: Cart Service receives event, updates ✓                     │
│                                                                      │
│   OR (if event lost):                                               │
│                                                                      │
│   T=0:  Product created in Product Service                         │
│   T=1s: Event published... Cart Service is down! ❌                 │
│   T=30m: ETL runs, finds missing product, syncs ✓                  │
│                                                                      │
│   Either way: Eventually consistent!                                │
│                                                                      │
│   Good for:                                                         │
│   ├── High availability requirements                               │
│   ├── Read-heavy workloads                                         │
│   ├── When stale data is acceptable temporarily                    │
│   └── Shopping carts, product catalogs                             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Pattern 2: Version Numbers (Optimistic Concurrency)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    VERSION NUMBERS                                   │
│                                                                      │
│   Problem: Two services update the same record simultaneously       │
│                                                                      │
│   Solution: Track versions, reject outdated updates                 │
│                                                                      │
│   ┌─────────────────────────────────────────┐                       │
│   │  Cart Record                             │                       │
│   │  {                                       │                       │
│   │    cartId: "abc123",                    │                       │
│   │    quantity: 5,                          │                       │
│   │    version: 3  ◀── Version number       │                       │
│   │  }                                       │                       │
│   └─────────────────────────────────────────┘                       │
│                                                                      │
│   Update Logic:                                                     │
│   ─────────────                                                     │
│   UPDATE cart                                                       │
│   SET quantity = 10, version = version + 1                         │
│   WHERE cartId = 'abc123' AND version = 3  ◀── Must match!         │
│                                                                      │
│   If version doesn't match → Update fails → Retry with fresh data  │
│                                                                      │
│   Our Implementation:                                               │
│   ────────────────────                                              │
│   @VersionColumn()                                                  │
│   version: number;  // TypeORM auto-increments this                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Pattern 3: Idempotency

```
┌─────────────────────────────────────────────────────────────────────┐
│                      IDEMPOTENCY                                     │
│                                                                      │
│   Definition: An operation can be applied multiple times            │
│               without changing the result beyond the first time.    │
│                                                                      │
│   Problem:                                                          │
│   ─────────                                                         │
│   [ProductCreated: ID=123] → Cart receives, inserts product        │
│   [ProductCreated: ID=123] → Cart receives AGAIN (retry/duplicate) │
│                              Duplicate product! ❌                  │
│                                                                      │
│   Solution: Idempotent operations                                   │
│   ──────────────────────────────                                    │
│   Instead of: INSERT product                                        │
│   Use:        UPSERT product (insert or update if exists)          │
│                                                                      │
│   [ProductCreated: ID=123] → UPSERT → Product inserted             │
│   [ProductCreated: ID=123] → UPSERT → Product updated (no-op)      │
│   [ProductCreated: ID=123] → UPSERT → Product updated (no-op)      │
│                                                                      │
│   Result: Same regardless of how many times we process!            │
│                                                                      │
│   Our ETL is naturally idempotent:                                  │
│   ────────────────────────────────                                  │
│   - Checks what's missing before inserting                         │
│   - Running twice doesn't create duplicates                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔗 Data Ownership in Microservices

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DATA OWNERSHIP                                    │
│                                                                      │
│   Golden Rule: Each service owns its data. No shared databases!    │
│                                                                      │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │  Product Service OWNS:                                        │  │
│   │  ├── Product details (title, description)                    │  │
│   │  ├── Pricing                                                 │  │
│   │  ├── Inventory                                               │  │
│   │  └── Categories                                              │  │
│   └──────────────────────────────────────────────────────────────┘  │
│                              │                                       │
│                              ▼ (Copy, not share)                    │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │  Cart Service NEEDS:                                          │  │
│   │  ├── Product ID (for reference)                              │  │
│   │  ├── Title (for display)                                     │  │
│   │  ├── Price (for calculation)                                 │  │
│   │  └── Image (for display)                                     │  │
│   └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│   Cart doesn't need: description, categories, full inventory       │
│   ETL syncs ONLY what Cart needs (denormalized copy)               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Why Duplicate Data?

```
┌─────────────────────────────────────────────────────────────────────┐
│           SHARED DATABASE vs DUPLICATED DATA                         │
│                                                                      │
│   Option A: Shared Database (DON'T DO THIS!)                        │
│   ──────────────────────────────────────────                        │
│   Product Service ──┐                                               │
│                     ├──▶ Single PostgreSQL ◀── Tight coupling!     │
│   Cart Service ─────┘                                               │
│                                                                      │
│   Problems:                                                         │
│   ├── Can't scale services independently                           │
│   ├── Schema changes break other services                          │
│   ├── Single point of failure                                      │
│   └── Services compete for database resources                      │
│                                                                      │
│   Option B: Each Service Has Own Database (Our approach)           │
│   ──────────────────────────────────────────────────────            │
│   Product Service ──▶ MongoDB (owns products)                      │
│         │                                                           │
│         ▼ (ETL copies relevant fields)                             │
│   Cart Service ──────▶ PostgreSQL (has product copy)               │
│                                                                      │
│   Benefits:                                                         │
│   ├── Services are independent (can scale separately)              │
│   ├── Each can choose best database for their needs               │
│   ├── No shared bottleneck                                         │
│   └── Failures are isolated                                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🏥 Handling Failures

### The ETL Failure Modes

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FAILURE SCENARIOS                                 │
│                                                                      │
│   1. Source Database Down                                           │
│   ───────────────────────                                           │
│   ETL → MongoDB (Product) 💀                                        │
│                                                                      │
│   Response: Log error, retry later, alert ops team                 │
│   Code:                                                             │
│   try { await fetchSourceProducts(); }                             │
│   catch { result.errors.push("Source unavailable"); throw; }       │
│                                                                      │
│   2. Target Database Down                                           │
│   ─────────────────────                                             │
│   ETL → PostgreSQL (Cart) 💀                                        │
│                                                                      │
│   Response: Same as above                                           │
│                                                                      │
│   3. Partial Batch Failure                                          │
│   ────────────────────────                                          │
│   Batch 1 ✓ → Batch 2 ✓ → Batch 3 ❌ → Batch 4 ✓                   │
│                                                                      │
│   Response: Log error, continue with other batches                 │
│   Code:                                                             │
│   try { await save(batch); }                                       │
│   catch { console.error(error); continue; }  // Don't stop!       │
│                                                                      │
│   4. Network Timeout                                                │
│   ──────────────────                                                │
│   ETL → [30 second query] → Timeout!                               │
│                                                                      │
│   Response: Reduce batch size, add connection timeout              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Graceful Shutdown

```typescript
// Our implementation handles SIGTERM/SIGINT
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');

  // 1. Stop accepting new work
  CronScheduler.destroy();

  // 2. Close database connections properly
  await DatabaseConnections.close();

  // 3. Exit cleanly
  process.exit(0);
});
```

**Why This Matters:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    KUBERNETES SHUTDOWN                               │
│                                                                      │
│   What Kubernetes does:                                             │
│   1. Sends SIGTERM to pod                                           │
│   2. Waits 30 seconds (configurable)                               │
│   3. Sends SIGKILL if still running                                │
│                                                                      │
│   Without graceful shutdown:                                        │
│   - Database connections left open (connection leaks)              │
│   - Queries interrupted mid-execution (corrupt data?)              │
│   - Scheduler might double-process                                 │
│                                                                      │
│   With graceful shutdown:                                           │
│   - Clean connection closure                                        │
│   - Running sync completes before exit                             │
│   - No resource leaks                                              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🧠 Key Distributed Systems Principles

| Principle | What It Means | How We Apply It |
| --- | --- | --- |
| **Assume failure** | Networks, services will fail | Retry logic, continue on error |
| **Design for eventual consistency** | Immediate consistency is expensive | ETL syncs periodically |
| **Idempotency** | Same operation, same result | Check before insert |
| **Partition tolerance** | Network splits will happen | Each service works independently |
| **Graceful degradation** | Work with what you have | Partial sync > no sync |
| **Observability** | You can't fix what you can't see | Logging, health checks |

---

## ➡️ Next Chapter

[Chapter 6: Testing & Debugging](./06-testing-debugging.md)
