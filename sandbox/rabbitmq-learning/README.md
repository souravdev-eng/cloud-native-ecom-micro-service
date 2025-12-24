# RabbitMQ Learning Sandbox 🐰

A comprehensive collection of RabbitMQ examples in Node.js demonstrating various messaging patterns and concepts.

> 📚 **New!** Check out the detailed learning guide in [`docs/`](./docs/00-overview.md) for digestible, sequential documentation with real-world analogies from our e-commerce project.

## 📋 Prerequisites

- Node.js (v14 or higher)
- Docker and Docker Compose
- npm or yarn

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd sandbox/rabbitmq-learning
npm install
```

### 2. Start Services

**Start All Services** (RabbitMQ + Redis):

```bash
npm run start:rabbitmq
# or
docker-compose up -d
```

**Services Available**:

- **RabbitMQ AMQP**: `localhost:5672`
- **RabbitMQ Management UI**: `http://localhost:15672` (admin/admin123)
- **Redis**: `localhost:6379`

### 3. View RabbitMQ Logs

```bash
npm run logs
# or
docker-compose logs -f rabbitmq
```

### 4. Stop Services

```bash
npm run stop:rabbitmq
# or
docker-compose down
```

## 📚 Examples Overview

### 1. Basic Queue (Hello World) 🌟

The simplest example demonstrating basic message publishing and consuming.

**Location**: `01-basic/`

**Run Publisher**:

```bash
npm run publisher
# or
node 01-basic/publisher.js
```

**Run Consumer** (in another terminal):

```bash
npm run consumer
# or
node 01-basic/consumer.js
```

**Key Concepts**:

- Direct queue messaging
- Message acknowledgment
- Durable queues
- Persistent messages

---

### 2. Work Queues (Task Distribution) 👷

Distributes time-consuming tasks among multiple workers.

**Location**: `02-work-queues/`

**Send Tasks**:

```bash
npm run work-queue:sender
# or
node 02-work-queues/sender.js
```

**Start Worker(s)** (run multiple instances):

```bash
npm run work-queue:worker
# or
node 02-work-queues/worker.js
```

**Key Concepts**:

- Fair dispatch (prefetch)
- Load balancing
- Multiple consumers
- Task distribution

---

### 3. Publish/Subscribe (Fanout Exchange) 📢

Broadcasts messages to all connected subscribers.

**Location**: `03-publish-subscribe/`

**Run Publisher**:

```bash
npm run pubsub:publisher
# or
node 03-publish-subscribe/publisher.js
```

**Run Subscriber(s)** (run multiple instances):

```bash
npm run pubsub:subscriber
# or
node 03-publish-subscribe/subscriber.js
```

**Key Concepts**:

- Fanout exchange
- Temporary queues
- Broadcasting
- Multiple subscribers receive same message

---

### 4. Routing (Direct Exchange) 🎯

Routes messages based on routing keys.

**Location**: `04-routing/`

**Send Messages**:

```bash
npm run routing:sender
# or
node 04-routing/sender.js
```

**Receive Messages** (specify severities):

```bash
npm run routing:receiver
# or
node 04-routing/receiver.js info warning error
node 04-routing/receiver.js error  # Only errors
node 04-routing/receiver.js info   # Only info
```

**Key Concepts**:

- Direct exchange
- Routing keys
- Selective message receiving
- Multiple bindings

---

### 5. Topics (Topic Exchange) 🌐

Advanced routing with pattern matching.

**Location**: `05-topics/`

**Send Messages**:

```bash
npm run topic:sender
# or
node 05-topics/sender.js
```

**Receive Messages** (with patterns):

```bash
npm run topic:receiver
# or
node 05-topics/receiver.js "#"              # All messages
node 05-topics/receiver.js "*.error"        # All errors
node 05-topics/receiver.js "auth.*"         # All auth messages
node 05-topics/receiver.js "payment.#"      # All payment messages
node 05-topics/receiver.js "*.info" "*.error" # Info and errors
```

**Pattern Rules**:

- `*` (star) matches exactly one word
- `#` (hash) matches zero or more words
- Words are separated by dots (.)

**Key Concepts**:

- Topic exchange
- Pattern matching
- Flexible routing
- Wildcard subscriptions

---

### 6. RPC (Remote Procedure Call) 🖥️

Request/reply pattern for remote procedure calls.

**Location**: `06-rpc/`

**Start RPC Server**:

```bash
npm run rpc:server
# or
node 06-rpc/server.js
```

**Run RPC Client** (in another terminal):

```bash
npm run rpc:client
# or
node 06-rpc/client.js
```

**Available Functions**:

- `fibonacci(n)` - Calculate Fibonacci number
- `factorial(n)` - Calculate factorial
- `isPrime(n)` - Check if number is prime
- `sqrt(n)` - Calculate square root
- `power({base, exponent})` - Calculate power

**Key Concepts**:

- Request/Reply pattern
- Correlation IDs
- Reply queues
- Timeout handling

---

### 7. Dead Letter Exchange (DLX) ☠️

Advanced error handling with automatic retry logic and poison message management.

**Location**: `07-dead-letter-exchange/`

**Run Publisher**:

```bash
npm run dlx:publisher
# or
node 07-dead-letter-exchange/publisher.js
```

**Run Consumer** (in another terminal):

```bash
npm run dlx:consumer
# or
node 07-dead-letter-exchange/consumer.js
```

**Message Flow**:

1. Messages published to main exchange
2. Failed messages automatically sent to Dead Letter Exchange
3. After TTL expires, messages retry from DLX
4. After max retries, poison messages stay in DLX for manual review

**Key Concepts**:

- Dead Letter Exchange configuration
- Automatic retry with exponential backoff
- Poison message handling
- TTL (Time To Live) for retry delays
- Max retry limits
- Manual intervention for persistent failures

---

### 8. Idempotency (Message Deduplication) 🔄

Ensures messages are processed exactly once using Redis-based deduplication.

**Location**: `08-idempotency/`

**Prerequisites**: Both RabbitMQ and Redis must be running (use `npm run start:rabbitmq`)

**Run Publisher**:

```bash
npm run idempotency:publisher
# or
node 08-idempotency/publisher.js
```

**Run Consumer** (in another terminal):

```bash
npm run idempotency:consumer
# or
node 08-idempotency/consumer.js
```

**Key Concepts**:

- Idempotency keys for message deduplication
- Redis-based duplicate detection
- Processing locks to prevent race conditions
- Exactly-once processing guarantees
- Handling duplicate messages gracefully
- TTL for idempotency key cleanup

## 🏗️ Architecture Patterns

### Message Patterns Comparison

| Pattern          | Exchange Type | Use Case                 | Example                  |
| ---------------- | ------------- | ------------------------ | ------------------------ |
| **Simple Queue** | Default       | Point-to-point messaging | Task processing          |
| **Work Queue**   | Default       | Load balancing           | Background jobs          |
| **Pub/Sub**      | Fanout        | Broadcasting             | Notifications            |
| **Routing**      | Direct        | Selective routing        | Log levels               |
| **Topics**       | Topic         | Pattern-based routing    | Multi-criteria filtering |
| **RPC**          | Default       | Request/Reply            | Remote services          |
| **DLX**          | Direct        | Error handling & retry   | Failed message recovery  |
| **Idempotency**  | Direct        | Duplicate prevention     | Payment processing       |

## 🔍 Monitoring

### RabbitMQ Management UI

Access the management interface at: `http://localhost:15672`

**Features**:

- View queues and exchanges
- Monitor message rates
- Check connections
- Manage users and permissions
- View message details

### Key Metrics to Monitor

1. **Queue Length**: Number of messages waiting
2. **Message Rates**: Publish/Deliver/Acknowledge rates
3. **Consumer Utilization**: How busy consumers are
4. **Connection Count**: Number of active connections
5. **Memory Usage**: RabbitMQ memory consumption

## 📖 Core Concepts

### 1. **Connections & Channels**

- **Connection**: TCP connection to RabbitMQ
- **Channel**: Virtual connection inside a TCP connection
- Multiple channels share one connection

### 2. **Exchanges**

- **Default**: Direct routing to queue with same name
- **Direct**: Routes based on exact routing key match
- **Topic**: Routes based on pattern matching
- **Fanout**: Broadcasts to all bound queues
- **Headers**: Routes based on message headers

### 3. **Queues**

- **Durable**: Survives broker restart
- **Exclusive**: Used by only one connection
- **Auto-delete**: Deleted when last consumer disconnects

### 4. **Messages**

- **Persistent**: Survives broker restart
- **Acknowledgment**: Confirms message processing
- **Routing Key**: Determines message routing

### 5. **Bindings**

- Links between exchanges and queues
- Can have routing patterns

## 🛠️ Troubleshooting

### Common Issues

1. **Connection Refused**

   - Ensure RabbitMQ is running: `docker-compose ps`
   - Check ports: 5672 (AMQP), 15672 (Management)

2. **Authentication Failed**

   - Default credentials: admin/admin123
   - Check docker-compose.yml for credentials

3. **Queue Not Found**

   - Queues are created on first use
   - Run consumer before publisher for persistent queues

4. **Messages Lost**

   - Use durable queues and persistent messages
   - Implement proper acknowledgment

5. **Slow Performance**
   - Adjust prefetch count
   - Use multiple consumers
   - Check network latency

## 📚 Best Practices

1. **Connection Management**

   - Reuse connections and channels
   - Handle connection failures gracefully
   - Implement reconnection logic

2. **Queue Design**

   - Use meaningful queue names
   - Set appropriate TTL for messages
   - Monitor queue lengths

3. **Message Handling**

   - Always acknowledge messages
   - Implement idempotent consumers
   - Handle poison messages

4. **Error Handling**

   - Implement dead letter exchanges
   - Log failed messages
   - Set up alerts for critical failures

5. **Performance**
   - Batch messages when possible
   - Use appropriate prefetch values
   - Consider message size limits

## 🔗 Useful Resources

- [RabbitMQ Official Documentation](https://www.rabbitmq.com/documentation.html)
- [AMQP Concepts](https://www.rabbitmq.com/tutorials/amqp-concepts.html)
- [RabbitMQ Best Practices](https://www.cloudamqp.com/blog/part1-rabbitmq-best-practice.html)
- [Node.js amqplib Documentation](https://www.squaremobius.net/amqp.node/)

## 📝 Notes

- All examples use plain JavaScript (no TypeScript)
- Examples are designed for learning, not production use
- Each example is self-contained and can run independently
- Modify connection settings in each file if needed

## 🤝 Contributing

Feel free to add more examples or improve existing ones!

---

Happy Learning! 🎉
