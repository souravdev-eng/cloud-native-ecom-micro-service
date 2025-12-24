# 03 - Publish/Subscribe (Fanout Exchange) 📢

> Broadcast messages to ALL connected subscribers simultaneously.

---

## 🎯 What You'll Learn

- Fanout exchange concept
- Temporary/exclusive queues
- Broadcasting to multiple consumers
- Exchange vs Queue difference

---

## 📻 Real-World Analogy: Radio Broadcasting

```
                              ┌────────────────┐
                          ┌──►│  📻 Radio #1   │ Plays music
                          │   │   (Kitchen)    │
┌───────────────┐         │   └────────────────┘
│               │         │
│  📡 Radio     │─────────┤   ┌────────────────┐
│   Station    │────Broadcast──►│  📻 Radio #2   │ Plays same music
│  (Exchange)   │         │   │   (Bedroom)    │
│               │         │   └────────────────┘
└───────────────┘         │
                          │   ┌────────────────┐
                          └──►│  📻 Radio #3   │ Plays same music
                              │   (Car)        │
                              └────────────────┘
```

**Scenario**: A radio station broadcasts a song. Every radio tuned in receives the SAME song at the SAME time. The station doesn't know or care how many radios are listening.

**Key Points**:

- One message → All subscribers receive it
- Subscribers can join/leave anytime
- No subscriber affects another

---

## 🏪 E-Commerce Project Example

### Price Update Notification

When product price changes, ALL services need to know:

```
                                    ┌─────────────────────┐
                                ┌──►│  Cart Service       │ Update cart totals
   ┌──────────────┐             │   └─────────────────────┘
   │              │   Fanout    │
   │   Product    │─────────────┤   ┌─────────────────────┐
   │   Service    │  Exchange   ├──►│  Order Service      │ Recalculate pending
   │(Price Update)│             │   └─────────────────────┘
   └──────────────┘             │
        │                       │   ┌─────────────────────┐
   "iPhone now                  ├──►│  ETL Service        │ Update analytics
    $899!"                      │   └─────────────────────┘
                                │
                                │   ┌─────────────────────┐
                                └──►│  Search Service     │ Re-index product
                                    └─────────────────────┘
```

**Why Fanout here?**

- EVERY service needs this information
- No filtering needed (all get same message)
- Services process independently

---

## 🔬 How It Works

### Exchange Types Comparison

```
┌─────────────────────────────────────────────────────────────────┐
│                       EXCHANGE TYPES                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  FANOUT (This lesson)         DIRECT (Next lesson)              │
│  ─────────────────────        ─────────────────────             │
│                                                                  │
│  Message ─► Exchange          Message ─► Exchange               │
│              │                 (key=A)      │                    │
│      ┌───────┼───────┐              ┌──────┼──────┐             │
│      ▼       ▼       ▼              ▼      │      ▼             │
│   Queue1  Queue2  Queue3         Queue1    │   Queue2           │
│                                  (key=A)   │   (key=B)          │
│   ALL get the message!                     │                     │
│                                    Only matching key!            │
└─────────────────────────────────────────────────────────────────┘
```

### Fanout Exchange Flow

```
1. Publisher                2. Fanout Exchange           3. Subscribers
   ┌─────────┐                 ┌─────────┐                ┌─────────┐
   │ Publish │                 │ Copies  │                │ Queue 1 │──► Consumer 1
   │ to      │ ──Message──►    │ message │ ─────────────► └─────────┘
   │Exchange │                 │ to ALL  │                ┌─────────┐
   └─────────┘                 │ bound   │ ─────────────► │ Queue 2 │──► Consumer 2
                               │ queues  │                └─────────┘
                               └─────────┘                ┌─────────┐
                                          ─────────────► │ Queue 3 │──► Consumer 3
                                                         └─────────┘
```

---

## 💻 Code Walkthrough

### Publisher

```javascript
const EXCHANGE_NAME = 'logs_fanout';

// Declare FANOUT exchange
await channel.assertExchange(EXCHANGE_NAME, 'fanout', {
  durable: false,
});

// Publish log message
const logMessage = {
  level: 'INFO',
  service: 'auth-service',
  message: 'User logged in',
};

// Note: routing key is ignored for fanout (using empty string)
channel.publish(EXCHANGE_NAME, '', Buffer.from(JSON.stringify(logMessage)));

console.log(`📡 Broadcast: ${logMessage.message}`);
```

### Subscriber

```javascript
const EXCHANGE_NAME = 'logs_fanout';
const SUBSCRIBER_ID = `Subscriber-${Math.floor(Math.random() * 1000)}`;

// Declare the same exchange
await channel.assertExchange(EXCHANGE_NAME, 'fanout', {
  durable: false,
});

// Create EXCLUSIVE queue (temporary, auto-delete)
const q = await channel.assertQueue('', {
  exclusive: true, // ⭐ Deleted when this consumer disconnects
});

// Bind queue to exchange (no routing key for fanout)
await channel.bindQueue(q.queue, EXCHANGE_NAME, '');

console.log(`📻 ${SUBSCRIBER_ID} listening on ${q.queue}`);

// Start consuming
await channel.consume(
  q.queue,
  (msg) => {
    const log = JSON.parse(msg.content.toString());
    console.log(`📨 [${SUBSCRIBER_ID}] Received: ${log.message}`);
  },
  {
    noAck: true, // Auto-acknowledge broadcasts
  }
);
```

---

## 🧪 Try It Yourself

### Terminal 1, 2, 3 - Start Subscribers

```bash
# Terminal 1
node 03-publish-subscribe/subscriber.js

# Terminal 2
node 03-publish-subscribe/subscriber.js

# Terminal 3
node 03-publish-subscribe/subscriber.js
```

### Terminal 4 - Publish Messages

```bash
node 03-publish-subscribe/publisher.js
```

### Watch All Subscribers Receive Same Messages! ✨

```
# Subscriber 1 (Terminal 1):
📨 [Subscriber-123] Received: [INFO] auth-service - Log message 1
📨 [Subscriber-123] Received: [WARNING] payment-service - Log message 2

# Subscriber 2 (Terminal 2):
📨 [Subscriber-456] Received: [INFO] auth-service - Log message 1
📨 [Subscriber-456] Received: [WARNING] payment-service - Log message 2

# Subscriber 3 (Terminal 3):
📨 [Subscriber-789] Received: [INFO] auth-service - Log message 1
📨 [Subscriber-789] Received: [WARNING] payment-service - Log message 2
```

---

## 📊 Visual: Message Duplication

```
Publisher                     Exchange                    Subscribers
─────────                     ────────                    ───────────

                              ┌──────────────┐
                              │              │
   Message ─────────────────► │   FANOUT     │
   "Price                     │              │
    Updated"                  │   COPIES     │
                              │   MESSAGE    │
                              │              │
                              └──────┬───────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
              ┌───────────┐   ┌───────────┐   ┌───────────┐
              │ Queue A   │   │ Queue B   │   │ Queue C   │
              │ (Cart)    │   │ (Order)   │   │ (ETL)     │
              ├───────────┤   ├───────────┤   ├───────────┤
              │"Price     │   │"Price     │   │"Price     │
              │ Updated"  │   │ Updated"  │   │ Updated"  │
              └───────────┘   └───────────┘   └───────────┘
```

---

## 🤔 Queue vs Exchange

| Aspect          | Queue                        | Exchange        |
| --------------- | ---------------------------- | --------------- |
| **Purpose**     | Store messages               | Route messages  |
| **Persistence** | Can be durable               | Routing only    |
| **Consumers**   | 1 consumer gets each message | Doesn't consume |
| **Bindings**    | Receives from exchanges      | Sends to queues |

```
Producer ──► Exchange ──► Binding ──► Queue ──► Consumer
             (Router)     (Rules)    (Storage)
```

---

## 🎓 Key Takeaways

| Concept             | Remember                              |
| ------------------- | ------------------------------------- |
| **Fanout Exchange** | Broadcasts to ALL bound queues        |
| **Exclusive Queue** | Temporary, deleted on disconnect      |
| **Binding**         | Connection between exchange and queue |
| **Routing Key**     | Ignored in fanout (use empty string)  |

---

## 🔗 In Our Codebase

Pub/Sub patterns in our project:

```
# Event Broadcasting
common/src/events/         → Shared event definitions
product/src/events/        → Product update events
order/src/events/          → Order status changes

# All services that might need updates
cart/src/queues/          → Listens for product changes
etl-service/src/          → Listens for data sync events
```

---

## 💡 When to Use Fanout

✅ **Good For:**

- Event notifications (user signed up, order placed)
- Cache invalidation across services
- Logging to multiple destinations
- Real-time updates to all clients

❌ **Not Good For:**

- When different subscribers need different messages
- When you need routing logic
- Task distribution (use work queues instead)

---

## ❓ Quick Quiz

1. What happens to messages if no subscribers are connected?
2. Why use `exclusive: true` for subscriber queues?
3. What's the routing key for fanout exchanges?

<details>
<summary>Answers</summary>

1. Messages are discarded (no queue to store them)
2. Queue is automatically deleted when subscriber disconnects
3. Empty string (routing key is ignored in fanout)

</details>

---

[← Work Queues](./02-work-queues.md) | [Next: Routing →](./04-routing.md)
