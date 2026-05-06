# 🐰 RabbitMQ Concepts - Learning Guide

> A sequential, digestible guide to RabbitMQ patterns with real-world analogies from our E-commerce microservices project.

---

## 📚 Learning Path

| # | Concept | Difficulty | Time | Key Takeaway |
| --- | --- | --- | --- | --- |
| 1 | [Basic Queue](./01-basic-queue.md) | 🟢 Beginner | 10 min | Point-to-point messaging |
| 2 | [Work Queues](./02-work-queues.md) | 🟢 Beginner | 15 min | Load balancing across workers |
| 3 | [Publish/Subscribe](./03-publish-subscribe.md) | 🟡 Intermediate | 15 min | Broadcasting to all subscribers |
| 4 | [Routing](./04-routing.md) | 🟡 Intermediate | 15 min | Selective message routing |
| 5 | [Topics](./05-topics.md) | 🟡 Intermediate | 20 min | Pattern-based routing |
| 6 | [RPC](./06-rpc.md) | 🟠 Advanced | 20 min | Request/Reply pattern |
| 7 | [Dead Letter Exchange](./07-dead-letter-exchange.md) | 🟠 Advanced | 25 min | Error handling & retries |
| 8 | [Idempotency](./08-idempotency.md) | 🔴 Expert | 25 min | Exactly-once processing |

---

## 🏪 Our E-Commerce Context

Throughout this guide, we'll reference our microservices:

```
┌─────────────────────────────────────────────────────────────────┐
│                    E-COMMERCE MICROSERVICES                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌──────────────┐       │
│   │  Auth   │  │  Cart   │  │  Order  │  │  Notification │       │
│   │ Service │  │ Service │  │ Service │  │   Service     │       │
│   └────┬────┘  └────┬────┘  └────┬────┘  └───────┬──────┘       │
│        │            │            │               │               │
│        └────────────┼────────────┼───────────────┘               │
│                     │            │                               │
│                     ▼            ▼                               │
│              ┌──────────────────────────┐                        │
│              │       RabbitMQ           │                        │
│              │    Message Broker        │                        │
│              └──────────────────────────┘                        │
│                     │            │                               │
│        ┌────────────┼────────────┼───────────────┐               │
│        │            │            │               │               │
│   ┌────┴────┐  ┌────┴────┐  ┌────┴────┐  ┌──────┴──────┐        │
│   │ Product │  │ Review  │  │   ETL   │  │   Payment   │        │
│   │ Service │  │ Service │  │ Service │  │   Service   │        │
│   └─────────┘  └─────────┘  └─────────┘  └─────────────┘        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧠 Core RabbitMQ Concepts

### The Postal System Analogy

Think of RabbitMQ as a sophisticated **postal system**:

| RabbitMQ Term   | Postal Analogy | Description                          |
| --------------- | -------------- | ------------------------------------ |
| **Producer**    | Sender         | Application that sends messages      |
| **Consumer**    | Recipient      | Application that receives messages   |
| **Queue**       | Mailbox        | Buffer that stores messages          |
| **Exchange**    | Post Office    | Routes messages to queues            |
| **Binding**     | Delivery Rules | Rules connecting exchanges to queues |
| **Routing Key** | Address        | Determines message destination       |

### Message Flow

```
Producer ──► Exchange ──► Binding ──► Queue ──► Consumer
   │            │            │          │          │
 Sends      Routes by     Matches    Stores    Processes
 message    rules         pattern    safely    message
```

---

## 🎯 Quick Reference: When to Use What?

| Pattern         | Use When...                            | Our Project Example               |
| --------------- | -------------------------------------- | --------------------------------- |
| **Basic Queue** | Simple one-to-one messaging            | Auth service → Email verification |
| **Work Queue**  | Tasks need load balancing              | Order processing across workers   |
| **Pub/Sub**     | All subscribers need same message      | Price update to all services      |
| **Routing**     | Different handlers for different types | Log levels (error, warning, info) |
| **Topics**      | Complex routing with patterns          | `order.*.payment` messages        |
| **RPC**         | Need synchronous-like response         | Inventory check before order      |
| **DLX**         | Need retry & error handling            | Failed payment retries            |
| **Idempotency** | Prevent duplicate processing           | Payment must process once only    |

---

## 🚀 Getting Started

### Prerequisites

```bash
# 1. Navigate to the sandbox
cd sandbox/rabbitmq-learning

# 2. Install dependencies
npm install

# 3. Start RabbitMQ + Redis
docker-compose up -d

# 4. Verify services
docker-compose ps
```

### Access Points

| Service       | URL                      | Credentials    |
| ------------- | ------------------------ | -------------- |
| RabbitMQ AMQP | `localhost:5672`         | admin/admin123 |
| RabbitMQ UI   | `http://localhost:15672` | admin/admin123 |
| Redis         | `localhost:6379`         | -              |

---

## 📖 How to Use This Guide

1. **Start from 01-basic** - Each concept builds on the previous
2. **Run the demos** - Theory + Practice = Understanding
3. **Read the analogies** - Connect to real-world scenarios
4. **Check project examples** - See how it applies to our codebase
5. **Revise regularly** - Use the quick reference tables

---

> 💡 **Pro Tip**: Open the RabbitMQ Management UI (`http://localhost:15672`) while running demos to visualize queues, exchanges, and message flow.

---

Next: [01 - Basic Queue →](./01-basic-queue.md)
