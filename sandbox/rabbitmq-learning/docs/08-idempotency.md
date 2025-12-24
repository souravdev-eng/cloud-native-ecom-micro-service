# 08 - Idempotency (Message Deduplication) 🔄

> Ensure messages are processed exactly once, even if delivered multiple times.

---

## 🎯 What You'll Learn

- Idempotency key concept
- Redis-based deduplication
- Processing locks for race conditions
- Exactly-once processing guarantee

---

## 💳 Real-World Analogy: Credit Card Retry

```
┌─────────────────────────────────────────────────────────────────┐
│                 PAYMENT TERMINAL SCENARIO                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Customer swipes card → Network timeout → "Try again"          │
│                                                                  │
│   WITHOUT Idempotency:                                           │
│   ─────────────────────                                          │
│   Swipe #1: ✅ $100 charged                                      │
│   Swipe #2: ✅ $100 charged  ← DOUBLE CHARGE! 😱                 │
│                                                                  │
│   WITH Idempotency (Transaction ID):                             │
│   ────────────────────────────────────                           │
│   Swipe #1: ✅ $100 charged (TXN-12345)                          │
│   Swipe #2: 🔄 TXN-12345 already processed, return same result   │
│            (No duplicate charge!)                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Key Points**:

- Same transaction ID = same operation
- Network retries shouldn't cause duplicates
- Store processed IDs to detect duplicates

---

## 🏪 E-Commerce Project Example

### Payment Processing

```
┌──────────────────────────────────────────────────────────────────┐
│                    PAYMENT IDEMPOTENCY FLOW                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│   Order Service sends payment request:                            │
│   {                                                               │
│     "paymentId": "PAY-001",                                       │
│     "idempotencyKey": "abc-123-def-456",  ← Unique per attempt   │
│     "amount": 99.99,                                              │
│     "customerId": "CUST-001"                                      │
│   }                                                               │
│                                                                   │
│   Payment Consumer:                                               │
│   ┌────────────────────────────────────────────────────────────┐ │
│   │ 1. Check Redis: Is "abc-123-def-456" processed?            │ │
│   │    ├─► YES: Return cached result (no reprocessing)         │ │
│   │    └─► NO: Continue...                                      │ │
│   │                                                              │ │
│   │ 2. Acquire processing lock (prevent race conditions)        │ │
│   │                                                              │ │
│   │ 3. Double-check: Still not processed?                       │ │
│   │                                                              │ │
│   │ 4. Process payment (charge card)                            │ │
│   │                                                              │ │
│   │ 5. Store in Redis: "abc-123-def-456" → processed           │ │
│   │                                                              │ │
│   │ 6. Acknowledge message                                       │ │
│   │                                                              │ │
│   │ 7. Release lock                                              │ │
│   └────────────────────────────────────────────────────────────┘ │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔬 How It Works

### The Problem: Duplicate Messages

```
Message sent once → Network issues → Message redelivered

Consumer #1: Processing PAY-001... ████████ (in progress)
Consumer #2: Processing PAY-001... ████████ (race condition!)

Result: Customer charged twice! 😱
```

### The Solution: Idempotency Keys + Locks

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│   Message arrives with idempotency-key: "abc-123"               │
│                         │                                        │
│                         ▼                                        │
│              ┌─────────────────────┐                            │
│              │  Check Redis:       │                            │
│              │  "idempotent:abc-123"│                            │
│              │  exists?            │                            │
│              └──────────┬──────────┘                            │
│                         │                                        │
│            ┌────────────┴────────────┐                          │
│            │                         │                          │
│         EXISTS                    NOT EXISTS                    │
│            │                         │                          │
│            ▼                         ▼                          │
│   ┌────────────────┐      ┌─────────────────────┐              │
│   │ Return cached  │      │ Acquire lock:       │              │
│   │ result         │      │ "lock:abc-123"      │              │
│   │ (no work done) │      └──────────┬──────────┘              │
│   └────────────────┘                 │                          │
│                           ┌──────────┴──────────┐              │
│                           │                      │              │
│                      GOT LOCK              LOCK BUSY            │
│                           │                      │              │
│                           ▼                      ▼              │
│                   ┌────────────────┐    ┌────────────────┐     │
│                   │ Process        │    │ Wait & retry   │     │
│                   │ Store result   │    │ (or requeue)   │     │
│                   │ Release lock   │    └────────────────┘     │
│                   └────────────────┘                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💻 Code Walkthrough

### Idempotency Manager (Redis)

```javascript
class IdempotencyManager {
  constructor(redisClient) {
    this.redis = redisClient;
  }

  // Check if already processed
  async isProcessed(idempotencyKey) {
    const key = `idempotent:payment:${idempotencyKey}`;
    return (await this.redis.get(key)) !== null;
  }

  // Mark as processed (with 24h TTL)
  async markProcessed(idempotencyKey, result) {
    const key = `idempotent:payment:${idempotencyKey}`;
    await this.redis.setEx(
      key,
      86400,
      JSON.stringify({
        processedAt: new Date().toISOString(),
        result: result,
      })
    );
  }

  // Acquire lock (prevents race conditions)
  async acquireLock(idempotencyKey, ttlSeconds = 300) {
    const lockKey = `lock:payment:${idempotencyKey}`;
    const lockValue = `${Date.now()}-${Math.random()}`;

    const result = await this.redis.set(lockKey, lockValue, {
      NX: true, // Only if not exists
      EX: ttlSeconds,
    });

    return result === 'OK' ? lockValue : null;
  }

  // Release lock
  async releaseLock(idempotencyKey, lockValue) {
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      end
      return 0
    `;
    await this.redis.eval(script, { keys: [lockKey], arguments: [lockValue] });
  }
}
```

### Consumer with Idempotency

```javascript
async function handleMessage(channel, message, idempotencyManager) {
  const payment = JSON.parse(message.content.toString());
  const idempotencyKey = message.properties.headers['idempotency-key'];

  // 1. Check if already processed
  if (await idempotencyManager.isProcessed(idempotencyKey)) {
    console.log('🔄 DUPLICATE - Already processed');
    channel.ack(message); // Acknowledge but don't process
    return;
  }

  // 2. Acquire lock
  const lockValue = await idempotencyManager.acquireLock(idempotencyKey);
  if (!lockValue) {
    console.log('⏳ Locked by another consumer - will retry');
    channel.nack(message, false, true); // Requeue
    return;
  }

  try {
    // 3. Double-check (race condition protection)
    if (await idempotencyManager.isProcessed(idempotencyKey)) {
      channel.ack(message);
      return;
    }

    // 4. Process payment
    const result = await processPayment(payment);

    // 5. Mark as processed
    await idempotencyManager.markProcessed(idempotencyKey, result);

    // 6. Acknowledge
    channel.ack(message);
  } finally {
    // 7. Always release lock
    await idempotencyManager.releaseLock(idempotencyKey, lockValue);
  }
}
```

---

## 🧪 Try It Yourself

### Start Services

```bash
# RabbitMQ + Redis
docker-compose up -d
```

### Terminal 1 - Start Consumer

```bash
node 08-idempotency/consumer.js
```

### Terminal 2 - Publish with Duplicates

```bash
node 08-idempotency/publisher.js
```

### Watch Deduplication! ✨

```
# Publisher sends 6 messages (3 original + 3 duplicates):
✅ Published PAY-001 (idempotency: abc-123...)
✅ Published PAY-002 (idempotency: def-456...)
✅ Published PAY-003 (idempotency: ghi-789...)
🔄 Published PAY-001-DUPLICATE (same idempotency as PAY-001)
🔄 Published PAY-001-DUPLICATE-2 (same idempotency as PAY-001)
🔄 Published PAY-002-DUPLICATE (same idempotency as PAY-002)

# Consumer output:
💳 Processing PAY-001... ✅ Success
💳 Processing PAY-002... ✅ Success
💳 Processing PAY-003... ✅ Success
🔄 DUPLICATE DETECTED - PAY-001 already processed
🔄 DUPLICATE DETECTED - PAY-001 already processed
🔄 DUPLICATE DETECTED - PAY-002 already processed

# Result: Only 3 payments processed, not 6!
```

---

## 🎓 Key Takeaways

| Concept             | Remember                        |
| ------------------- | ------------------------------- |
| **Idempotency Key** | Unique ID per operation attempt |
| **Redis Check**     | Fast lookup for duplicates      |
| **Processing Lock** | Prevents race conditions        |
| **Double-Check**    | Verify after acquiring lock     |
| **TTL**             | Clean up old keys automatically |

---

## 🔗 In Our Codebase

Idempotency patterns in our project:

```
# Payment processing
order/src/services/      → Payment idempotency
notification/src/        → Email deduplication

# Event handling
common/src/middleware/   → Idempotency middleware
cart/src/queues/         → Cart operation deduplication
```

---

## 💡 Best Practices

| Practice               | Why                     |
| ---------------------- | ----------------------- |
| Generate key on client | Same retry = same key   |
| Use UUID v4            | Globally unique         |
| Set TTL on Redis keys  | Auto-cleanup            |
| Lock before processing | Prevent race conditions |
| Store result with key  | Return cached response  |

---

## ❓ Quick Quiz

1. Why use a lock in addition to duplicate check?
2. What should the TTL be for idempotency keys?
3. Where should the idempotency key be generated?

<details>
<summary>Answers</summary>

1. Two consumers might check simultaneously and both see "not processed"
2. Long enough to cover retry period (e.g., 24 hours)
3. On the client/sender side, so retries use the same key

</details>

---

[← Dead Letter Exchange](./07-dead-letter-exchange.md) | [🏠 Overview](./00-overview.md)
