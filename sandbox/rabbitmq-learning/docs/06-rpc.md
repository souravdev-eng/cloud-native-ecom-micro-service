# 06 - RPC (Remote Procedure Call) 🖥️

> Request/Reply pattern for synchronous-like communication over async messaging.

---

## 🎯 What You'll Learn

- Request/Reply pattern
- Correlation IDs
- Reply queues
- Timeout handling
- When to use RPC

---

## ☎️ Real-World Analogy: Customer Support Hotline

```
┌─────────────────────────────────────────────────────────────────┐
│                        RPC PATTERN                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   1. Customer calls support                                      │
│      ┌──────────┐    "My order #12345"    ┌──────────┐          │
│      │          │ ──────────────────────► │          │          │
│      │  Client  │    + callback number    │  Server  │          │
│      │          │    + ticket #ABC123     │          │          │
│      └──────────┘                         └──────────┘          │
│                                                                  │
│   2. Customer waits (or does other things)                       │
│                                                                  │
│   3. Support calls back with answer                              │
│      ┌──────────┐    "Order shipped!"     ┌──────────┐          │
│      │          │ ◄────────────────────── │          │          │
│      │  Client  │    References #ABC123   │  Server  │          │
│      │          │                         │          │          │
│      └──────────┘                         └──────────┘          │
│                                                                  │
│   Ticket #ABC123 = Correlation ID (matches request → response)   │
│   Callback number = Reply Queue                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Key Points**:
- Client sends request + callback info
- Server processes and calls back
- Correlation ID links response to request
- Client can handle multiple pending requests

---

## 🏪 E-Commerce Project Example

### Inventory Check Before Checkout

Before confirming an order, check if items are in stock:

```
┌────────────────┐                              ┌────────────────┐
│                │   1. "Is iPhone in stock?"   │                │
│  Order         │ ─────────────────────────►   │   Product      │
│  Service       │   + replyTo: order-reply-q   │   Service      │
│                │   + correlationId: abc123    │   (Inventory)  │
│                │                              │                │
│  [Waiting...]  │                              │  [Checking...] │
│                │                              │                │
│                │   2. "Yes, 50 available"     │                │
│                │ ◄─────────────────────────   │                │
│                │   correlationId: abc123      │                │
│                │                              │                │
│  [Continue     │                              │                │
│   checkout]    │                              │                │
└────────────────┘                              └────────────────┘
```

**Why RPC here?**
- Order service NEEDS the answer before proceeding
- Can't place order without knowing stock
- Synchronous-like behavior over async messaging

---

## 🔬 How It Works

### RPC Message Flow

```
              Client                           Server
              ──────                           ──────
                │                                 │
                │  1. Create reply queue          │
                │     (exclusive, auto-delete)    │
                │                                 │
                │  2. Send request to RPC queue   │
                │     ┌─────────────────────┐     │
                │     │ • Function: fibonacci│     │
                │     │ • Args: 10           │     │
                │     │ • replyTo: reply-q   │     │
                │     │ • correlationId: X   │     │
                │     └─────────────────────┘     │
                │────────────────────────────────►│
                │                                 │
                │  3. [Waiting for response...]   │  4. Process request
                │                                 │     Calculate fib(10)
                │                                 │
                │  5. Response to reply queue     │
                │     ┌─────────────────────┐     │
                │     │ • result: 55        │     │
                │     │ • correlationId: X  │     │
                │     └─────────────────────┘     │
                │◄────────────────────────────────│
                │                                 │
                │  6. Match correlationId X       │
                │     Return result to caller     │
                │                                 │
```

### Why Correlation ID?

```
Without Correlation ID:              With Correlation ID:
─────────────────────────           ─────────────────────────

Client sends Request A ─►           Client sends Request A (id=1) ─►
Client sends Request B ─►           Client sends Request B (id=2) ─►

Response arrives: ???               Response arrives (id=2): 
Which request is this for?          This is for Request B! ✅

Response arrives: ???               Response arrives (id=1):
Which request is this for?          This is for Request A! ✅
```

---

## 💻 Code Walkthrough

### RPC Server

```javascript
const RPC_QUEUE = 'rpc_queue';

// Available functions
const rpcFunctions = {
  fibonacci: (n) => { /* calculate fibonacci */ },
  factorial: (n) => { /* calculate factorial */ },
  isPrime: (n) => { /* check if prime */ },
};

// Declare RPC queue
await channel.assertQueue(RPC_QUEUE, { durable: false });
channel.prefetch(1);

// Handle requests
await channel.consume(RPC_QUEUE, async (msg) => {
  const request = JSON.parse(msg.content.toString());
  
  console.log(`Request: ${request.function}(${request.args})`);
  
  // Execute function
  const result = rpcFunctions[request.function](request.args);
  
  // ⭐ Send response to reply queue with same correlationId
  channel.sendToQueue(
    msg.properties.replyTo,  // Reply to client's queue
    Buffer.from(JSON.stringify({ result })),
    { correlationId: msg.properties.correlationId }  // Match request
  );
  
  channel.ack(msg);
});
```

### RPC Client

```javascript
class RPCClient {
  constructor() {
    this.pendingRequests = new Map();
  }

  async connect() {
    this.connection = await amqp.connect(RABBITMQ_URL);
    this.channel = await this.connection.createChannel();
    
    // ⭐ Create exclusive reply queue
    const q = await this.channel.assertQueue('', { exclusive: true });
    this.replyQueue = q.queue;
    
    // Listen for responses
    await this.channel.consume(this.replyQueue, (msg) => {
      const correlationId = msg.properties.correlationId;
      const pending = this.pendingRequests.get(correlationId);
      
      if (pending) {
        pending.resolve(JSON.parse(msg.content.toString()));
        this.pendingRequests.delete(correlationId);
      }
    }, { noAck: true });
  }

  async call(functionName, args, timeout = 5000) {
    const correlationId = uuidv4();
    
    // Create promise for response
    const responsePromise = new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(correlationId);
        reject(new Error('RPC timeout'));
      }, timeout);
      
      this.pendingRequests.set(correlationId, { 
        resolve: (response) => {
          clearTimeout(timer);
          resolve(response);
        }
      });
    });
    
    // ⭐ Send request with replyTo and correlationId
    this.channel.sendToQueue('rpc_queue', 
      Buffer.from(JSON.stringify({ function: functionName, args })),
      { replyTo: this.replyQueue, correlationId }
    );
    
    return responsePromise;
  }
}

// Usage
const client = new RPCClient();
await client.connect();

const result = await client.call('fibonacci', 10);
console.log(result);  // { result: 55 }
```

---

## 🧪 Try It Yourself

### Terminal 1 - Start RPC Server

```bash
node 06-rpc/server.js
```

**Expected Output:**
```
🖥️  RPC Server Started
Available functions:
  - fibonacci(n)
  - factorial(n)
  - isPrime(n)
⏳ Waiting for RPC requests...
```

### Terminal 2 - Run RPC Client

```bash
node 06-rpc/client.js
```

### Watch Request/Response! ✨

```
# Client Output:
📞 Calling fibonacci(10)...
   Result: 55
   Execution time: 2ms

📞 Calling factorial(5)...
   Result: 120
   Execution time: 1ms

📞 Calling isPrime(17)...
   Result: true
   Execution time: 1ms

# Server Output:
📥 RPC Request: fibonacci(10)
   ✅ Result: 55
   📤 Response sent

📥 RPC Request: factorial(5)
   ✅ Result: 120
   📤 Response sent
```

---

## ⚠️ Important Considerations

### Timeouts

```javascript
// Always set timeouts for RPC calls
const result = await client.call('slowFunction', args, 5000);  // 5 second timeout

// Handle timeout gracefully
try {
  const result = await client.call('function', args);
} catch (error) {
  if (error.message === 'RPC timeout') {
    console.log('Server is taking too long, try again later');
  }
}
```

### When NOT to Use RPC

| ❌ Avoid RPC When | ✅ Use RPC When |
|------------------|-----------------|
| Fire-and-forget is OK | Must wait for result |
| High throughput needed | Occasional sync calls |
| Long processing time | Quick operations |
| Can decouple with events | Tight request/response |

---

## 🆚 RPC vs Direct HTTP

| Aspect | RPC over RabbitMQ | Direct HTTP |
|--------|-------------------|-------------|
| **Reliability** | Messages persist, retry | Connection fails = lost |
| **Load Balancing** | Multiple servers consume | Need load balancer |
| **Decoupling** | Services don't know each other | Direct dependency |
| **Latency** | Slightly higher | Lower |
| **Use Case** | Async-first architecture | Simple APIs |

---

## 🎓 Key Takeaways

| Concept | Remember |
|---------|----------|
| **Correlation ID** | Links request to response |
| **Reply Queue** | Exclusive queue for responses |
| **Timeout** | Always set, handle failures |
| **Prefetch** | Fair dispatch for servers |

---

## 🔗 In Our Codebase

RPC-like patterns in our project:

```
# Inventory checks
order/src/services/     → Check product availability
product/src/routes/     → Respond to stock queries

# Payment validation
payment/src/            → Validate payment method
cart/src/               → Request payment validation
```

---

## 💡 Best Practices

1. **Always set timeouts** - Don't wait forever
2. **Handle errors gracefully** - Server might be down
3. **Use for occasional calls** - Not for high-frequency ops
4. **Consider alternatives** - Events, caching, direct HTTP

---

## ❓ Quick Quiz

1. What's the purpose of correlation ID?
2. Why use an exclusive reply queue?
3. When would you NOT use RPC?

<details>
<summary>Answers</summary>

1. To match responses with their original requests
2. Ensures only this client gets its responses, auto-deletes on disconnect
3. For fire-and-forget tasks, high-throughput operations, or long-running processes

</details>

---

[← Topics](./05-topics.md) | [Next: Dead Letter Exchange →](./07-dead-letter-exchange.md)

