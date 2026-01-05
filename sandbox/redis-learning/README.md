# 🚀 Redis Caching Patterns - Learning Sandbox

> Master Redis caching strategies through hands-on examples directly connected to your e-commerce microservices.

---

## 🎯 What You'll Learn

This sandbox takes you from Redis basics to advanced production patterns, with real examples you can integrate into your Product, Cart, and Order services.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         REDIS LEARNING JOURNEY                               │
│                                                                              │
│   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐               │
│   │   BASICS     │     │   CACHING    │     │  ADVANCED    │               │
│   │              │     │   PATTERNS   │     │   FEATURES   │               │
│   │ • Data Types │ ──▶ │ • Cache-Aside│ ──▶ │ • Dist. Lock │               │
│   │ • GET/SET    │     │ • Write-Thru │     │ • Rate Limit │               │
│   │ • TTL        │     │ • Invalidate │     │ • Sessions   │               │
│   │ • Hashes     │     │              │     │ • Leaderboard│               │
│   └──────────────┘     └──────────────┘     └──────────────┘               │
│                                                                              │
│   YOUR PRODUCT SERVICE ALREADY USES REDIS! 🎉                               │
│   This sandbox helps you understand and extend it.                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Current Redis Usage in Your Project

You already have Redis integrated in your **Product Service**:

| File                                | Purpose              | Pattern Used      |
| ----------------------------------- | -------------------- | ----------------- |
| `product/src/redisClient.ts`        | Redis connection     | Singleton         |
| `product/src/utils/cacheKeys.ts`    | Cache key generation | Hash-based keys   |
| `product/src/utils/calculateTTL.ts` | TTL calculation      | Time-based expiry |
| `product/src/routes/showProduct.ts` | Product caching      | Cache-aside       |

**This sandbox will help you:**

- Understand WHY these patterns work
- Learn NEW patterns to add
- Build confidence debugging Redis issues

---

## 📚 Documentation

Start with the [Documentation Index](./docs/00-index.md) for a complete learning path.

### Quick Reference

| Chapter | Topic | What You'll Learn |
| --- | --- | --- |
| [01](./docs/01-redis-fundamentals.md) | **Redis Fundamentals** | Data types, commands, when to use what |
| [02](./docs/02-caching-patterns.md) | **Caching Patterns** | Cache-aside, write-through, write-behind |
| [03](./docs/03-cache-invalidation.md) | **Cache Invalidation** | TTL, event-based, pattern-based |
| [04](./docs/04-distributed-locks.md) | **Distributed Locks** | Prevent race conditions, Redlock |
| [05](./docs/05-rate-limiting.md) | **Rate Limiting** | Token bucket, sliding window |
| [06](./docs/06-session-management.md) | **Session Management** | User sessions, cart state |
| [07](./docs/07-sorted-sets-leaderboards.md) | **Sorted Sets** | Leaderboards, rankings |
| [08](./docs/08-production-patterns.md) | **Production Patterns** | Cluster, HA, monitoring |

---

## 💻 Code Examples

Each pattern has working TypeScript examples:

```
examples/
├── 01-basic-operations/        # GET, SET, HSET, Lists, Sets
├── 02-cache-aside-pattern/     # Read-through caching
├── 03-write-through-cache/     # Write + cache simultaneously
├── 04-cache-invalidation/      # TTL, event-based, pattern deletion
├── 05-distributed-locks/       # Prevent race conditions
├── 06-rate-limiting/           # API throttling
├── 07-session-store/           # User sessions
└── 08-leaderboard-sorted-sets/ # Rankings with sorted sets
```

---

## 🛒 E-commerce Use Cases

| Use Case             | Pattern          | Where to Implement                 |
| -------------------- | ---------------- | ---------------------------------- |
| Product catalog      | Cache-aside      | Product Service ✅ (already done!) |
| Flash sale inventory | Distributed Lock | Order Service                      |
| API rate limiting    | Token Bucket     | All services (middleware)          |
| User sessions        | Session Store    | Auth Service                       |
| Shopping cart        | Hash storage     | Cart Service                       |
| Trending products    | Sorted Sets      | Product Service                    |
| Search autocomplete  | Sorted Sets      | Product Service                    |

---

## 🚀 Quick Start

### 1. Start Redis (if not running)

```bash
# Using Docker Compose (recommended)
cd /Users/sauravmajumdar/Developer/project/micro-service/cloud-native-ecom-micro-service
docker-compose -f tools/docker-compose.yml up redis -d

# Or if using K8s
kubectl port-forward svc/product-redis-srv 6379:6379
```

### 2. Run Examples

```bash
cd sandbox/redis-learning/examples

# Install dependencies
npm install

# Run a specific example
npx ts-node 01-basic-operations/index.ts
```

### 3. Connect to Redis CLI

```bash
# Using Docker
docker exec -it redis redis-cli

# Or with redis-cli installed
redis-cli -h localhost -p 6379
```

---

## 📦 Prerequisites

- ✅ Node.js 18+ installed
- ✅ Redis server running (Docker/K8s)
- ✅ TypeScript knowledge
- ✅ Basic understanding of key-value stores

---

## 📊 Learning Checklist

Track your progress:

- [ ] **Fundamentals**
  - [ ] Understand all 5 data types
  - [ ] Master basic commands (GET, SET, HSET, LPUSH, SADD, ZADD)
  - [ ] Understand TTL and expiration
- [ ] **Caching Patterns**
  - [ ] Implement cache-aside (read-through)
  - [ ] Implement write-through
  - [ ] Understand write-behind (async)
- [ ] **Cache Invalidation**
  - [ ] TTL-based expiration
  - [ ] Event-driven invalidation
  - [ ] Pattern-based key deletion
- [ ] **Advanced Patterns**
  - [ ] Distributed locks with Redlock
  - [ ] Rate limiting middleware
  - [ ] Session management
  - [ ] Leaderboards with sorted sets

---

## 🔗 Related Resources

- [Redis Official Documentation](https://redis.io/docs/)
- [Redis University](https://university.redis.com/) (Free courses)
- [Your Product Service Redis Code](../../product/src/redisClient.ts)

---

## ⏱️ Estimated Learning Time

| Topic               | Reading      | Hands-on       | Total          |
| ------------------- | ------------ | -------------- | -------------- |
| Fundamentals        | 30 min       | 30 min         | 1 hour         |
| Caching Patterns    | 45 min       | 1 hour         | 1.75 hours     |
| Cache Invalidation  | 30 min       | 45 min         | 1.25 hours     |
| Distributed Locks   | 30 min       | 1 hour         | 1.5 hours      |
| Rate Limiting       | 30 min       | 45 min         | 1.25 hours     |
| Session Management  | 20 min       | 30 min         | 50 min         |
| Sorted Sets         | 30 min       | 45 min         | 1.25 hours     |
| Production Patterns | 30 min       | 30 min         | 1 hour         |
| **Total**           | **~4 hours** | **~5.5 hours** | **~9.5 hours** |

---

**Ready to start? → [Begin with Chapter 1: Redis Fundamentals](./docs/01-redis-fundamentals.md)**
