# 📚 Redis Caching Patterns - Learning Guide

> A comprehensive educational guide to mastering Redis caching in microservices architecture.

---

## 🎯 Who Is This For?

This guide is designed for developers who:
- Want to understand Redis beyond basic GET/SET
- Need to implement production-grade caching patterns
- Are working with microservices that need distributed caching
- Want practical, hands-on knowledge with real code examples

---

## 📖 Table of Contents

### Part 1: Foundations

| Chapter | Title | What You'll Learn |
|---------|-------|-------------------|
| [01](./01-redis-fundamentals.md) | **Redis Fundamentals** | Data types, commands, memory management |
| [02](./02-caching-patterns.md) | **Caching Patterns** | Cache-aside, write-through, write-behind |
| [03](./03-cache-invalidation.md) | **Cache Invalidation** | TTL strategies, event-based, pattern deletion |

### Part 2: Advanced Patterns

| Chapter | Title | What You'll Learn |
|---------|-------|-------------------|
| [04](./04-distributed-locks.md) | **Distributed Locks** | Race conditions, Redlock algorithm, deadlock prevention |
| [05](./05-rate-limiting.md) | **Rate Limiting** | Token bucket, sliding window, API throttling |
| [06](./06-session-management.md) | **Session Management** | Stateless auth, cart state, session clustering |

### Part 3: Real-World Applications

| Chapter | Title | What You'll Learn |
|---------|-------|-------------------|
| [07](./07-sorted-sets-leaderboards.md) | **Sorted Sets & Leaderboards** | Rankings, trending products, autocomplete |
| [08](./08-production-patterns.md) | **Production Best Practices** | Clustering, monitoring, disaster recovery |

---

## 🚀 Quick Start

### If you're new to Redis:
Start with [Chapter 1: Redis Fundamentals](./01-redis-fundamentals.md)

### If you understand Redis basics:
Jump to [Chapter 2: Caching Patterns](./02-caching-patterns.md)

### If you need specific patterns:
- Rate limiting → [Chapter 5](./05-rate-limiting.md)
- Distributed locks → [Chapter 4](./04-distributed-locks.md)
- Leaderboards → [Chapter 7](./07-sorted-sets-leaderboards.md)

---

## 🏗️ Redis in Your E-commerce System

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       REDIS IN YOUR ARCHITECTURE                             │
│                                                                              │
│   ┌──────────────┐                     ┌───────────────────┐                │
│   │   Product    │───────────────────▶│                   │                │
│   │   Service    │  Cache products     │                   │                │
│   └──────────────┘                     │                   │                │
│                                        │      REDIS        │                │
│   ┌──────────────┐                     │                   │                │
│   │    Auth      │───────────────────▶│  • Cache          │                │
│   │   Service    │  Sessions, tokens   │  • Sessions       │                │
│   └──────────────┘                     │  • Rate limiting  │                │
│                                        │  • Locks          │                │
│   ┌──────────────┐                     │  • Pub/Sub        │                │
│   │   Order      │───────────────────▶│                   │                │
│   │   Service    │  Distributed locks  │                   │                │
│   └──────────────┘                     └───────────────────┘                │
│                                                                              │
│   Currently: Product Service uses Redis for caching                         │
│   Goal: Extend to all services with proper patterns                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Learning Path Visualization

```
                    START HERE
                        │
                        ▼
        ┌───────────────────────────────┐
        │   Chapter 1: Fundamentals     │  ◀── Data types, commands
        │   Understanding Redis basics  │
        └───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │   Chapter 2: Caching Patterns │  ◀── Your Product Service uses this!
        │   Cache-aside, Write-through  │
        └───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │   Chapter 3: Invalidation     │  ◀── The hardest problem in CS!
        │   TTL, Events, Patterns       │
        └───────────────────────────────┘
                        │
            ┌───────────┴───────────┐
            ▼                       ▼
┌─────────────────────┐   ┌─────────────────────┐
│ Chapter 4: Locks    │   │ Chapter 5: Rate     │
│ Flash sale safety   │   │ Limiting            │
└─────────────────────┘   └─────────────────────┘
            │                       │
            └───────────┬───────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │   Chapter 6: Sessions         │  ◀── Auth integration
        │   User state management       │
        └───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │   Chapter 7: Sorted Sets      │  ◀── Trending products!
        │   Leaderboards, Rankings      │
        └───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │   Chapter 8: Production       │  ◀── Scale & monitor
        │   Clustering, HA, Monitoring  │
        └───────────────────────────────┘
                        │
                        ▼
                 🎉 COMPLETE! 🎉
```

---

## ⏱️ Time Estimates

| Chapter | Reading Time | Hands-on Practice |
|---------|--------------|-------------------|
| Chapter 1 | 30 min | 30 min |
| Chapter 2 | 45 min | 1 hour |
| Chapter 3 | 30 min | 45 min |
| Chapter 4 | 30 min | 1 hour |
| Chapter 5 | 30 min | 45 min |
| Chapter 6 | 20 min | 30 min |
| Chapter 7 | 30 min | 45 min |
| Chapter 8 | 30 min | 30 min |
| **Total** | **~4 hours** | **~5.5 hours** |

---

## 💡 Tips for Learning

1. **Run the examples** - Each chapter has working code in `/examples`
2. **Use Redis CLI** - Practice commands interactively
3. **Connect to your services** - Apply patterns to your e-commerce app
4. **Take notes** - Document any questions for further research
5. **Build incrementally** - Start simple, add complexity

---

## 🔗 Related Documentation

- [Main Redis README](../README.md) - Overview and quick start
- [Learning Roadmap](../../learning-roadmap/README.md) - Your complete learning path
- [Product Service Redis](../../../product/src/redisClient.ts) - Existing implementation

---

**Ready to start learning? [Begin with Chapter 1 →](./01-redis-fundamentals.md)**

