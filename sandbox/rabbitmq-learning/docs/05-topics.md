# 05 - Topics (Topic Exchange) 🌐

> Advanced routing with pattern matching using wildcards.

---

## 🎯 What You'll Learn

- Topic exchange concept
- Wildcard patterns (`*` and `#`)
- Multi-criteria routing
- Complex subscription patterns

---

## 📰 Real-World Analogy: News Subscription

```
   ┌─────────────────────────────────────────────────────────────────┐
   │                     NEWS AGENCY (Exchange)                       │
   │                                                                  │
   │   Articles Published:                                            │
   │   ├── sports.football.usa                                        │
   │   ├── sports.cricket.india                                       │
   │   ├── politics.election.usa                                      │
   │   ├── tech.ai.breakthrough                                       │
   │   └── sports.tennis.wimbledon                                    │
   └───────────────────────────┬─────────────────────────────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
         ▼                     ▼                     ▼
   ┌───────────┐         ┌───────────┐         ┌───────────┐
   │ Reader A  │         │ Reader B  │         │ Reader C  │
   │           │         │           │         │           │
   │ Pattern:  │         │ Pattern:  │         │ Pattern:  │
   │ sports.*  │         │ *.*.usa   │         │ #         │
   │           │         │           │         │           │
   │ Gets:     │         │ Gets:     │         │ Gets:     │
   │ • football│         │ • football│         │ ALL news! │
   │ • cricket │         │ • election│         │           │
   │ • tennis  │         │           │         │           │
   └───────────┘         └───────────┘         └───────────┘
```

**Scenario**: A news agency categorizes articles by `category.topic.location`. Readers subscribe to patterns:
- "All sports" → `sports.#`
- "All USA news" → `#.usa`
- "Football only" → `sports.football.*`

---

## 🏪 E-Commerce Project Example

### Multi-Criteria Event Routing

Route events based on `<service>.<event>.<severity>`:

```
   Events Published:                    Subscribers & Their Patterns:
   ─────────────────                    ────────────────────────────
   
   auth.login.info       ─────────────► Security Team: "auth.#"
   auth.login.error      ─────────────► (Gets ALL auth events)
   
   payment.processed.info ────────────► Finance Team: "payment.*.*"
   payment.failed.error  ─────────────► (Gets ALL payment events)
   
   order.created.info    ─────────────► Ops Team: "*.*.error"
   order.failed.error    ─────────────► (Gets ALL errors from any service)
   
   All of the above     ──────────────► Audit Log: "#"
                                        (Gets EVERYTHING)
```

**Why Topic Exchange here?**
- Need flexible, multi-criteria filtering
- Pattern matching across multiple dimensions
- Single event can match multiple subscribers

---

## 🔬 How It Works

### Wildcard Rules

| Symbol | Matches | Example |
|--------|---------|---------|
| `*` (star) | **Exactly one word** | `*.error` matches `auth.error`, not `auth.login.error` |
| `#` (hash) | **Zero or more words** | `auth.#` matches `auth`, `auth.login`, `auth.login.failed` |

### Pattern Matching Examples

```
Routing Key: "auth.login.error"
─────────────────────────────────

Pattern          Match?   Why?
───────          ──────   ────
"auth.login.error"  ✅    Exact match
"auth.*.error"      ✅    * = "login"
"*.login.error"     ✅    * = "auth"
"auth.#"            ✅    # = "login.error"
"#.error"           ✅    # = "auth.login"
"#"                 ✅    # = "auth.login.error"
"auth.*"            ❌    * matches one word, not two
"*.error"           ❌    * can't match "auth.login"
"payment.#"         ❌    Doesn't start with "payment"
```

---

## 💻 Code Walkthrough

### Sender (Topic Routing Keys)

```javascript
const EXCHANGE_NAME = 'topic_logs';

// Declare TOPIC exchange
await channel.assertExchange(EXCHANGE_NAME, 'topic', {
  durable: false
});

// Messages with topic routing keys: <facility>.<severity>
const messages = [
  { routingKey: 'auth.info', message: 'User login successful' },
  { routingKey: 'auth.error', message: 'Invalid credentials' },
  { routingKey: 'payment.info', message: 'Payment processed' },
  { routingKey: 'payment.error', message: 'Credit card declined' },
  { routingKey: 'order.info', message: 'Order placed' },
  { routingKey: 'order.warning', message: 'Low stock' },
];

for (const msg of messages) {
  channel.publish(EXCHANGE_NAME, msg.routingKey, 
    Buffer.from(JSON.stringify(msg)));
  console.log(`Sent [${msg.routingKey}]: ${msg.message}`);
}
```

### Receiver (Pattern Subscription)

```javascript
// Get patterns from command line
// Usage: node receiver.js "*.error" "auth.*"
const patterns = process.argv.slice(2);

// Declare exchange
await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: false });

// Create exclusive queue
const q = await channel.assertQueue('', { exclusive: true });

// ⭐ Bind queue for EACH pattern
for (const pattern of patterns) {
  await channel.bindQueue(q.queue, EXCHANGE_NAME, pattern);
  console.log(`Subscribed to pattern: "${pattern}"`);
}

// Consume matching messages
await channel.consume(q.queue, (msg) => {
  const routingKey = msg.fields.routingKey;
  const message = JSON.parse(msg.content.toString());
  
  console.log(`[${routingKey}] ${message.message}`);
  console.log(`  Matched pattern: ${findMatchingPattern(patterns, routingKey)}`);
}, { noAck: true });
```

---

## 🧪 Try It Yourself

### Terminal 1 - All Errors

```bash
node 05-topics/receiver.js "*.error"
```

### Terminal 2 - All Auth Events

```bash
node 05-topics/receiver.js "auth.*"
```

### Terminal 3 - Payment Info + All Errors

```bash
node 05-topics/receiver.js "payment.info" "*.error"
```

### Terminal 4 - EVERYTHING

```bash
node 05-topics/receiver.js "#"
```

### Terminal 5 - Send Messages

```bash
node 05-topics/sender.js
```

### Watch Pattern Matching! ✨

```
# Terminal 1 (*.error):
📨 [auth.error]: Invalid credentials
📨 [payment.error]: Credit card declined

# Terminal 2 (auth.*):
📨 [auth.info]: User login successful
📨 [auth.error]: Invalid credentials

# Terminal 3 (payment.info + *.error):
📨 [auth.error]: Invalid credentials
📨 [payment.info]: Payment processed
📨 [payment.error]: Credit card declined

# Terminal 4 (#):
📨 [auth.info]: User login successful
📨 [auth.error]: Invalid credentials
📨 [payment.info]: Payment processed
... (ALL messages)
```

---

## 📊 Visual: Pattern Matching Matrix

```
                        │ auth.  │ auth.  │payment.│payment.│ order. │ order. │
                        │ info   │ error  │  info  │ error  │  info  │warning │
────────────────────────┼────────┼────────┼────────┼────────┼────────┼────────┤
Pattern: "auth.info"    │   ✅   │   ❌   │   ❌   │   ❌   │   ❌   │   ❌   │
Pattern: "auth.*"       │   ✅   │   ✅   │   ❌   │   ❌   │   ❌   │   ❌   │
Pattern: "*.error"      │   ❌   │   ✅   │   ❌   │   ✅   │   ❌   │   ❌   │
Pattern: "*.info"       │   ✅   │   ❌   │   ✅   │   ❌   │   ✅   │   ❌   │
Pattern: "payment.#"    │   ❌   │   ❌   │   ✅   │   ✅   │   ❌   │   ❌   │
Pattern: "#"            │   ✅   │   ✅   │   ✅   │   ✅   │   ✅   │   ✅   │
────────────────────────┴────────┴────────┴────────┴────────┴────────┴────────┘
```

---

## 🆚 Direct vs Topic

| Aspect | Direct | Topic |
|--------|--------|-------|
| **Matching** | Exact | Pattern with wildcards |
| **Flexibility** | Low | High |
| **Routing Key** | Simple string | Dot-separated words |
| **Use Case** | Known categories | Complex hierarchies |

```
DIRECT:  "error" → Only "error" queue
TOPIC:   "*.error" → auth.error, payment.error, order.error...
```

---

## 🎓 Key Takeaways

| Concept | Remember |
|---------|----------|
| **`*` (star)** | Matches exactly ONE word |
| **`#` (hash)** | Matches ZERO or MORE words |
| **Word separator** | Dots (`.`) separate words |
| **Empty `#`** | Matches everything (like fanout) |

---

## 🔗 In Our Codebase

Topic exchange patterns in our project:

```
# Event naming convention: <service>.<entity>.<action>
order.product.added
order.product.removed
order.checkout.started
order.checkout.completed

# Subscriber patterns:
"order.#"           → Order service (all order events)
"*.product.*"       → Product service (product changes anywhere)
"*.*.completed"     → Analytics (all completions)
```

---

## 💡 Routing Key Best Practices

### Naming Convention

```
<service>.<entity>.<action>.<severity>

Examples:
├── auth.user.created.info
├── payment.transaction.failed.error
├── order.item.added.info
└── notification.email.sent.info
```

### Common Patterns

| Pattern | Description |
|---------|-------------|
| `service.#` | All events from a service |
| `*.entity.*` | All events for an entity type |
| `#.error` | All errors from anywhere |
| `service.*.action` | Specific action across entities |

---

## ❓ Quick Quiz

1. What's the difference between `*` and `#`?
2. Does `auth.*` match `auth.login.error`?
3. What pattern matches everything?

<details>
<summary>Answers</summary>

1. `*` matches exactly one word, `#` matches zero or more
2. No, `*` only matches one word. Use `auth.#`
3. `#` (matches zero or more words = everything)

</details>

---

[← Routing](./04-routing.md) | [Next: RPC →](./06-rpc.md)

