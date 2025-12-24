# 07 - Dead Letter Exchange (DLX) ☠️

> Handle failed messages with automatic retry and poison message management.

---

## 🎯 What You'll Learn

- Dead Letter Exchange concept
- Automatic retry mechanism
- Poison message handling
- TTL (Time To Live)
- Error recovery patterns

---

## 📮 Real-World Analogy: Post Office Return Process

```
┌─────────────────────────────────────────────────────────────────┐
│                    POSTAL DELIVERY SYSTEM                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   1. Mail sent to address                                        │
│      ┌─────────┐        ┌─────────────────┐                     │
│      │  Mail   │ ────►  │  Delivery Route │                     │
│      │  (Msg)  │        │  (Main Queue)   │                     │
│      └─────────┘        └────────┬────────┘                     │
│                                  │                               │
│   2. Delivery fails (no one home, wrong address, etc.)          │
│                                  │                               │
│                                  ▼                               │
│                         ┌─────────────────┐                     │
│                         │  Return to      │ ← Dead Letter       │
│                         │  Post Office    │   Exchange          │
│                         │  (DLX Queue)    │                     │
│                         └────────┬────────┘                     │
│                                  │                               │
│   3. Options:                    │                               │
│      ├── Retry delivery tomorrow ┼──► Back to Main Queue        │
│      ├── Return to sender        ┼──► Error handling            │
│      └── Discard after 3 tries   ┼──► Permanent failure         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Key Points**:

- Failed messages don't disappear
- Automatic retry after delay
- Eventually escalate to human review
- No message is silently lost

---

## 🏪 E-Commerce Project Example

### Order Processing with Retry

Payment service temporarily down? Orders shouldn't be lost:

```
┌────────────────────────────────────────────────────────────────┐
│                    ORDER PROCESSING FLOW                        │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────┐      ┌─────────────┐      ┌──────────────────┐   │
│   │  New    │ ──►  │  Order      │ ──►  │  Process Order   │   │
│   │  Order  │      │  Queue      │      │  (Payment, etc.) │   │
│   └─────────┘      └─────────────┘      └────────┬─────────┘   │
│                                                   │              │
│                           Success ───────────────►│──► ✅ Done  │
│                                                   │              │
│                           Failure ───────────────►│              │
│                                                   ▼              │
│                                          ┌───────────────┐      │
│                                          │  Dead Letter  │      │
│                    (wait 30s)            │  Queue (DLQ)  │      │
│                         ◄────────────────└───────┬───────┘      │
│                         │                        │               │
│                    ┌────┴────┐             ┌─────┴─────┐        │
│                    │  Retry  │             │ Max Tries │        │
│                    │  Queue  │             │ Exceeded  │        │
│                    └────┬────┘             └─────┬─────┘        │
│                         │                        │               │
│                         ▼                        ▼               │
│                   Back to Order           Manual Review          │
│                   Queue (retry)           (Poison Message)       │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

**Why DLX here?**

- Payment gateway might be temporarily down
- Automatic retry saves orders
- Poison messages (invalid data) don't block queue
- Operations team gets alerted for manual review

---

## 🔬 How It Works

### DLX Architecture

```
                    Normal Flow
                    ───────────
                         │
                         ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│              │   │              │   │              │
│    Main      │──►│     Main     │──►│   Consumer   │
│   Exchange   │   │    Queue     │   │   Process    │
│              │   │              │   │              │
└──────────────┘   └──────┬───────┘   └──────┬───────┘
                          │                   │
                          │              nack(requeue=false)
                          │                   │
                          │                   ▼
                          │           ┌──────────────┐
                          │           │   Messages   │
                    x-dead-letter-    │   Rejected   │
                    exchange config   │   or Expired │
                          │           └──────┬───────┘
                          │                  │
                          ▼                  ▼
                   ┌──────────────┐   ┌──────────────┐
                   │    DLX       │◄──│   Routing    │
                   │   Exchange   │   │     Key      │
                   │              │   │              │
                   └──────┬───────┘   └──────────────┘
                          │
                          ▼
                   ┌──────────────┐
                   │    DLX       │
                   │    Queue     │
                   └──────┬───────┘
                          │
              ┌───────────┼───────────┐
              │           │           │
         TTL Expires  Max Retries   Manual
              │           │         Review
              ▼           ▼           ▼
         Retry Queue   Log Error   Alert Ops
```

### Queue Arguments for DLX

| Argument                    | Purpose                       |
| --------------------------- | ----------------------------- |
| `x-dead-letter-exchange`    | Where to send failed messages |
| `x-dead-letter-routing-key` | Routing key for DLX           |
| `x-message-ttl`             | Time before message expires   |

---

## 💻 Code Walkthrough

### Publisher (Setup Infrastructure)

```javascript
async function setupInfrastructure(channel) {
  // 1. Dead Letter Exchange
  await channel.assertExchange('order_processing_dlx', 'direct', { durable: true });

  // 2. Main Exchange
  await channel.assertExchange('order_processing', 'direct', { durable: true });

  // 3. Dead Letter Queue (with TTL for auto-retry)
  await channel.assertQueue('order_dlx_queue', {
    durable: true,
    arguments: {
      'x-message-ttl': 30000, // Wait 30 seconds before retry
      'x-dead-letter-exchange': 'order_processing', // Then go back
      'x-dead-letter-routing-key': 'retry',
    },
  });
  await channel.bindQueue('order_dlx_queue', 'order_processing_dlx', 'failed');

  // 4. Retry Queue
  await channel.assertQueue('order_retry_queue', {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': 'order_processing_dlx', // If fails again → DLX
      'x-dead-letter-routing-key': 'failed',
    },
  });
  await channel.bindQueue('order_retry_queue', 'order_processing', 'retry');

  // 5. Main Queue (with DLX configured)
  await channel.assertQueue('order_queue', {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': 'order_processing_dlx', // Failed → DLX
      'x-dead-letter-routing-key': 'failed',
    },
  });
  await channel.bindQueue('order_queue', 'order_processing', 'process');
}
```

### Consumer (With Retry Logic)

```javascript
const MAX_RETRY_COUNT = 3;

async function handleMessage(channel, message) {
  const order = JSON.parse(message.content.toString());
  const retryCount = message.properties.headers['x-retry-count'] || 0;

  console.log(`Processing order ${order.id} (attempt ${retryCount + 1}/${MAX_RETRY_COUNT + 1})`);

  try {
    // Attempt to process
    await processOrder(order);

    // Success! Acknowledge
    channel.ack(message);
    console.log(`✅ Order ${order.id} processed`);
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);

    if (retryCount >= MAX_RETRY_COUNT) {
      // ⭐ Max retries reached - send to DLX permanently
      console.log(`💀 Max retries exceeded for order ${order.id}`);
      channel.nack(message, false, false); // Don't requeue
    } else {
      // ⭐ Increment retry count and reject (will go to DLX, then retry)
      message.properties.headers['x-retry-count'] = retryCount + 1;
      channel.nack(message, false, false); // Don't requeue directly
      console.log(`🔄 Will retry after TTL expires`);
    }
  }
}
```

---

## 🧪 Try It Yourself

### Terminal 1 - Start Consumer

```bash
node 07-dead-letter-exchange/consumer.js
```

### Terminal 2 - Publish Test Orders

```bash
node 07-dead-letter-exchange/publisher.js
```

### Watch the Retry Flow! ✨

```
# Publisher sends 4 orders:
✅ Published order: ORD-001 (success)         ← Will succeed
✅ Published order: ORD-002 (temporary_fail)  ← Will fail twice, then succeed
✅ Published order: ORD-003 (poison)          ← Will always fail
✅ Published order: ORD-004 (success)         ← Will succeed

# Consumer output:
📨 Processing order ORD-001 (attempt 1/4)
   ✅ Order ORD-001 processed successfully!

📨 Processing order ORD-002 (attempt 1/4)
   ⚠️ Temporary failure - will retry

📨 Processing order ORD-003 (attempt 1/4)
   💀 Poison message - will always fail
   🔄 Will retry after TTL expires

# After 30 seconds (TTL):
📨 Processing order ORD-002 (attempt 2/4)
   ⚠️ Temporary failure - will retry

📨 Processing order ORD-003 (attempt 2/4)
   💀 Poison message - will always fail

# Eventually:
📨 Processing order ORD-002 (attempt 3/4)
   ✅ Order ORD-002 processed on retry!

📨 Processing order ORD-003 (attempt 4/4)
   💀 Max retries exceeded
   🏴‍☠️ Message sent to DLX for manual review
```

---

## 📊 Visual: Retry Timeline

```
Time    ORD-001        ORD-002          ORD-003          ORD-004
─────   ───────        ───────          ───────          ───────
0s      ✅ Success     ❌ Fail #1       ❌ Fail #1       ✅ Success
        Done!          → DLX            → DLX            Done!

30s                    ← Retry          ← Retry
                       ❌ Fail #2       ❌ Fail #2
                       → DLX            → DLX

60s                    ← Retry          ← Retry
                       ✅ Success!      ❌ Fail #3
                       Done!            → DLX

90s                                     ← Retry
                                        ❌ Fail #4
                                        MAX RETRIES!
                                        → Permanent DLX
                                        (Manual review)
```

---

## 🎓 Key Takeaways

| Concept                | Remember                          |
| ---------------------- | --------------------------------- |
| **DLX**                | Catches rejected/expired messages |
| **TTL**                | Delay before retry                |
| **Retry Count**        | Track attempts in headers         |
| **Poison Message**     | Fails after max retries           |
| **nack(false, false)** | Reject without requeue (→ DLX)    |

---

## 🔗 In Our Codebase

DLX patterns in our project:

```
# Order processing with retry
order/src/queues/        → Handles payment failures
notification/src/queue/  → Email delivery retries

# Event pattern
common/src/queues/       → Base retry configuration
cart/src/queues/         → Cart sync failures
```

---

## 💡 Production Tips

### Exponential Backoff

Instead of fixed TTL, increase delay with each retry:

```javascript
const getRetryDelay = (retryCount) => {
  // 30s, 60s, 120s, 240s...
  return Math.min(30000 * Math.pow(2, retryCount), 300000);
};
```

### Monitoring DLX

```javascript
// Check DLX queue periodically
setInterval(async () => {
  const info = await channel.checkQueue('order_dlx_queue');
  if (info.messageCount > 0) {
    console.log(`⚠️ ${info.messageCount} messages in DLX!`);
    // Alert ops team
  }
}, 60000);
```

---

## ❓ Quick Quiz

1. What triggers a message to go to DLX?
2. How do you implement retry delays?
3. What's a poison message?

<details>
<summary>Answers</summary>

1. Message rejected with `nack(false, false)`, message expired (TTL), or queue full
2. Set `x-message-ttl` on the DLX queue
3. A message that always fails processing, even after max retries

</details>

---

[← RPC](./06-rpc.md) | [Next: Idempotency →](./08-idempotency.md)
