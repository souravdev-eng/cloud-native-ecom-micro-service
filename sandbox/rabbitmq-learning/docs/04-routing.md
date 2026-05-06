# 04 - Routing (Direct Exchange) 🎯

> Route messages to specific queues based on exact routing key matching.

---

## 🎯 What You'll Learn

- Direct exchange concept
- Routing keys
- Multiple bindings
- Selective message consumption

---

## 📦 Real-World Analogy: Package Sorting Facility

```
                                        ┌───────────────┐
   Package                          ┌──►│  New York     │ 📦 NYC packages
   with label                       │   │  Delivery     │
   "NYC"                            │   └───────────────┘
      │        ┌───────────────┐    │
      └───────►│   Sorting     │────┤   ┌───────────────┐
               │    Facility   │    ├──►│  Los Angeles  │ 📦 LA packages
   Package     │   (Exchange)  │    │   │  Delivery     │
   "LA"        │               │────┤   └───────────────┘
      └───────►│  Reads label  │    │
               │  Routes to    │    │   ┌───────────────┐
   Package     │  correct      │    └──►│  Chicago      │ 📦 CHI packages
   "CHI"       │  destination  │        │  Delivery     │
      └───────►└───────────────┘        └───────────────┘
```

**Scenario**: A package sorting facility reads the destination label on each package and routes it to the correct delivery truck. Only the NYC truck gets NYC packages.

**Key Points**:

- Label (routing key) determines destination
- Exact match required
- Multiple packages can go to same destination

---

## 🏪 E-Commerce Project Example

### Log Level Routing

Route logs to different handlers based on severity:

```
   ┌─────────────┐
   │ Auth Service│──┐
   └─────────────┘  │     ┌──────────────────────────────────────────┐
                    │     │           Direct Exchange                 │
   ┌─────────────┐  │     │           "logs_direct"                  │
   │Order Service│──┤     │                                          │
   └─────────────┘  │     │    Routing Keys:                         │
                    │     │    ┌─────────┬─────────┬────────┐        │
   ┌─────────────┐  │     │   │  info   │ warning │ error    │        │
   │  Payment   │───┼────►│    │         │         │        │        │
   │  Service   │   │     │    └────┬────┴────┬────┴───┬────┘        │
   └─────────────┘  │     │         │         │        │             │
                    │     └─────────┼─────────┼────────┼─────────────┘
   ┌─────────────┐  │               │         │        │
   │Cart Service │──┘               ▼         ▼        ▼
   └─────────────┘           ┌─────────┐ ┌─────────┐ ┌─────────┐
                             │ Console │ │  Slack  │ │ PagerD. │
                             │  Logs   │ │  Alert  │ │  Alert  │
                             │ (info)  │ │(warning)│ │ (error) │
                             └─────────-┘ └─────────┘ └─────────┘
```

**Why Direct Exchange here?**

- Different log levels need different handling
- Errors → Pager Duty
- Warnings → Slack
- Info → Just console

---

## 🔬 How It Works

### Routing Key Matching

```
┌──────────────────────────────────────────────────────────────────┐
│                    DIRECT EXCHANGE ROUTING                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│   Publisher                    Exchange                Consumers  │
│   ─────────                    ────────                ─────────  │
│                                                                   │
│   [key=error] ─────────►  ┌─────────────┐  ──error──► Queue A    │
│                           │   Direct    │                         │
│   [key=warning] ────────► │   Exchange  │  ──warning─► Queue B   │
│                           │             │                         │
│   [key=info] ───────────► │  (Matches   │  ──info───► Queue C    │
│                           │   exact     │                         │
│                           │   routing   │                         │
│                           │   keys)     │                         │
│                           └─────────────┘                         │
│                                                                   │
│   ❌ [key=debug] ────X──► NOT MATCHED = DROPPED                  │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### Multiple Bindings

One queue can listen to multiple routing keys:

```
                    ┌─────────────────┐
   key="error" ────►│                 │
                    │     Queue A     │  ← Receives BOTH
   key="warning" ──►│  (Ops Team)     │     error AND warning
                    │                 │
                    └─────────────────┘
```

---

## 💻 Code Walkthrough

### Sender (with routing keys)

```javascript
const EXCHANGE_NAME = 'direct_logs';

// Declare DIRECT exchange
await channel.assertExchange(EXCHANGE_NAME, 'direct', {
  durable: false,
});

// Messages with different severities
const messages = [
  { severity: 'info', message: 'Application started' },
  { severity: 'warning', message: 'Memory usage high' },
  { severity: 'error', message: 'Database connection failed' },
];

for (const msg of messages) {
  const buffer = Buffer.from(JSON.stringify(msg));

  // ⭐ Use severity as routing key
  channel.publish(EXCHANGE_NAME, msg.severity, buffer);

  console.log(`Sent [${msg.severity}]: ${msg.message}`);
}
```

### Receiver (subscribing to specific keys)

```javascript
// Get severities from command line
// Usage: node receiver.js error warning
const severities = process.argv.slice(2);

// Declare exchange
await channel.assertExchange(EXCHANGE_NAME, 'direct', { durable: false });

// Create exclusive queue
const q = await channel.assertQueue('', { exclusive: true });

// ⭐ Bind queue for EACH severity we want
for (const severity of severities) {
  await channel.bindQueue(q.queue, EXCHANGE_NAME, severity);
}

console.log(`Listening for: ${severities.join(', ')}`);

// Consume matching messages
await channel.consume(
  q.queue,
  (msg) => {
    const message = JSON.parse(msg.content.toString());
    const routingKey = msg.fields.routingKey;

    console.log(`[${routingKey}] ${message.message}`);
  },
  { noAck: true }
);
```

---

## 🧪 Try It Yourself

### Terminal 1 - Listen for ERRORS only

```bash
node 04-routing/receiver.js error
```

### Terminal 2 - Listen for WARNINGS only

```bash
node 04-routing/receiver.js warning
```

### Terminal 3 - Listen for BOTH errors AND warnings

```bash
node 04-routing/receiver.js error warning
```

### Terminal 4 - Send Messages

```bash
node 04-routing/sender.js
```

### Watch Selective Routing! ✨

```
# Terminal 1 (error only):
🔴 Sent [error]: Database connection failed
🔴 Sent [error]: Payment processing failed
🔴 Sent [error]: File not found

# Terminal 2 (warning only):
🟡 Sent [warning]: Memory usage above 70%
🟡 Sent [warning]: API rate limit approaching
🟡 Sent [warning]: Deprecated API endpoint used

# Terminal 3 (error + warning):
🔴 Sent [error]: Database connection failed
🟡 Sent [warning]: Memory usage above 70%
🔴 Sent [error]: Payment processing failed
...
```

---

## 📊 Visual: Routing in Action

```
Publisher sends messages with different routing keys:
─────────────────────────────────────────────────────

  Message        Routing Key       Delivered To
  ───────        ───────────       ────────────

  "App start"    info       ────► Console Logger (binds: info)
                                    ✅ Received!

  "Memory high"  warning    ────► Slack Alert (binds: warning)
                                    ✅ Received!

  "DB failed"    error      ────► PagerDuty (binds: error, warning)
                                    ✅ Received!

  "User login"   info       ────► Console Logger (binds: info)
                                    ✅ Received!
                                  Slack Alert ❌ (doesn't bind info)
```

---

## 🆚 Fanout vs Direct

| Aspect          | Fanout              | Direct                |
| --------------- | ------------------- | --------------------- |
| **Routing**     | ALL queues          | Matching key only     |
| **Use Case**    | Broadcast           | Selective delivery    |
| **Routing Key** | Ignored             | Required, exact match |
| **Example**     | "New product" → All | "Error" → Ops only    |

```
FANOUT:    Message ─► [Queue1, Queue2, Queue3] ← ALL receive
DIRECT:    Message(key=X) ─► [Only queues bound to X]
```

---

## 🎓 Key Takeaways

| Concept               | Remember                        |
| --------------------- | ------------------------------- |
| **Direct Exchange**   | Routes by exact key match       |
| **Routing Key**       | Determines message destination  |
| **Multiple Bindings** | One queue can bind to many keys |
| **Unmatched Keys**    | Messages are discarded          |

---

## 🔗 In Our Codebase

Direct exchange patterns in our project:

```
# Log routing by level
notification/src/queue/   → Route by notification type
order/src/events/         → Route by order status

# Example: Order status routing
order.created → New order queue
order.paid → Payment confirmation queue
order.shipped → Shipping notification queue
```

---

## 💡 When to Use Direct Exchange

✅ **Good For:**

- Log level routing
- Task type distribution
- Status-based routing
- Simple categorization

❌ **Not Good For:**

- Complex pattern matching (use Topics)
- Broadcasting (use Fanout)
- When you need wildcards

---

## ❓ Quick Quiz

1. What happens if no queue binds to a routing key?
2. Can one queue receive messages with different routing keys?
3. What's the difference between fanout and direct?

<details>
<summary>Answers</summary>

1. Message is discarded
2. Yes, bind the queue to multiple routing keys
3. Fanout broadcasts to all, direct routes by exact key match

</details>

---

[← Publish/Subscribe](./03-publish-subscribe.md) | [Next: Topics →](./05-topics.md)
