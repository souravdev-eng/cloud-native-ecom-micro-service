# 01 - Basic Queue (Hello World) 🌟

> The simplest messaging pattern: one producer sends, one consumer receives.

---

## 🎯 What You'll Learn

- Creating connections and channels
- Declaring queues
- Sending messages (publisher)
- Receiving messages (consumer)
- Message acknowledgment

---

## 📬 Real-World Analogy: The Mailbox

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│              │  📨      │              │  📨      │              │
│   SENDER     │ ──────► │   MAILBOX    │ ──────► │  RECIPIENT   │
│ (Publisher)  │         │   (Queue)    │         │  (Consumer)  │
│              │         │              │         │              │
└──────────────┘         └──────────────┘         └──────────────┘
```

**Scenario**: You write a letter (message) and put it in a mailbox (queue). The recipient checks the mailbox and retrieves the letter when they're ready.

**Key Points**:

- Sender doesn't wait for recipient
- Letter stays safe in mailbox until collected
- Recipient processes at their own pace

---

## 🏪 E-Commerce Project Example

### User Registration → Welcome Email

When a user registers, the Auth service sends a message to the Notification service:

```
┌─────────────┐         ┌─────────────┐         ┌─────────────────┐
│    Auth     │  user   │   welcome   │  user   │  Notification   │
│   Service   │ ──────► │   _queue    │ ──────► │    Service      │
│ (Register)  │ created │             │ created │  (Send Email)   │
└─────────────┘         └─────────────┘         └─────────────────┘
```

**Why Basic Queue here?**

- One producer (Auth) → One consumer (Notification)
- Simple, reliable delivery
- No complex routing needed

---

## 🔬 How It Works

### Message Flow

```
1. Publisher                    2. RabbitMQ                    3. Consumer
   ┌─────────┐                     ┌─────────┐                    ┌─────────┐
   │ Connect │                     │  Queue  │                    │ Connect │
   │ Channel │                     │ Created │                    │ Channel │
   │ Send    │ ──── Message ────►  │ Stored  │ ──── Message ────► │ Receive │
   │ Close   │                     │         │                    │ Ack     │
   └─────────┘                     └─────────┘                    └─────────┘
```

### Key Configuration Options

| Option             | Value    | Purpose                         |
| ------------------ | -------- | ------------------------------- |
| `durable: true`    | Queue    | Queue survives broker restart   |
| `persistent: true` | Message  | Message survives broker restart |
| `noAck: false`     | Consumer | Manual acknowledgment required  |
| `prefetch: 1`      | Consumer | Process one message at a time   |

---

## 💻 Code Walkthrough

### Publisher (Sender)

```javascript
// 1. Connect to RabbitMQ
const connection = await amqp.connect('amqp://admin:admin123@localhost:5672');

// 2. Create a channel (virtual connection)
const channel = await connection.createChannel();

// 3. Declare the queue (creates if doesn't exist)
await channel.assertQueue('hello_queue', {
  durable: true, // Survives restart
});

// 4. Send message
const message = { id: 1, text: 'Hello!' };
channel.sendToQueue('hello_queue', Buffer.from(JSON.stringify(message)), {
  persistent: true, // Survives restart
});

// 5. Close connection
await channel.close();
await connection.close();
```

### Consumer (Receiver)

```javascript
// 1-3. Same connection & queue setup...

// 4. Set prefetch (one at a time)
channel.prefetch(1);

// 5. Start consuming
await channel.consume(
  'hello_queue',
  async (message) => {
    const data = JSON.parse(message.content.toString());
    console.log('Received:', data);

    // Process the message...

    // 6. Acknowledge completion
    channel.ack(message);
  },
  {
    noAck: false, // We'll manually acknowledge
  }
);
```

---

## 🧪 Try It Yourself

### Terminal 1 - Start Consumer

```bash
cd sandbox/rabbitmq-learning
node 01-basic/consumer.js
```

**Expected Output:**

```
🚀 RabbitMQ Basic Consumer Started
📦 Queue "hello_queue" is ready
👂 Waiting for messages...
```

### Terminal 2 - Run Publisher

```bash
node 01-basic/publisher.js
```

**Expected Output:**

```
✅ Message sent: {"id":1,"text":"Hello RabbitMQ!"}
✅ Message sent: {"id":2,"text":"This is a test message"}
...
```

### Back in Terminal 1

```
📨 Received message:
   ID: 1
   Text: Hello RabbitMQ!
   ⏳ Processing...
   ✅ Message processed and acknowledged
```

---

## ⚠️ Message Acknowledgment

### Why Acknowledge?

```
Without Ack (noAck: true)          With Ack (noAck: false)
─────────────────────────          ────────────────────────
Message → Consumer                  Message → Consumer
         ↓                                   ↓
    Message GONE                        Still in Queue
         ↓                                   ↓
  Consumer crashes!                   Consumer crashes!
         ↓                                   ↓
  MESSAGE LOST ❌                     Message requeued ✅
                                            ↓
                                     Another consumer
                                     gets the message
```

### Acknowledgment Rules

| Action                            | When to Use                      |
| --------------------------------- | -------------------------------- |
| `channel.ack(msg)`                | Successfully processed           |
| `channel.nack(msg, false, true)`  | Failed, try again (requeue)      |
| `channel.nack(msg, false, false)` | Failed permanently (discard/DLX) |

---

## 🎓 Key Takeaways

| Concept         | Remember                             |
| --------------- | ------------------------------------ |
| **Queue**       | Buffer between producer and consumer |
| **Durable**     | Survives RabbitMQ restart            |
| **Persistent**  | Messages survive restart             |
| **Acknowledge** | Confirms safe processing             |
| **Prefetch**    | Controls processing rate             |

---

## 🔗 In Our Codebase

Check how we use basic queues in the project:

```
auth/src/queue/        → User registration events
notification/src/queue/ → Email notification handling
cart/src/queues/       → Cart update events
```

---

## ❓ Quick Quiz

1. What happens if consumer crashes before acknowledging?
2. Why use `durable: true`?
3. When would you use `prefetch(1)`?

<details>
<summary>Answers</summary>

1. Message returns to queue for redelivery
2. Queue survives RabbitMQ restart
3. When processing is slow and you want fair distribution

</details>

---

[← Overview](./00-overview.md) | [Next: Work Queues →](./02-work-queues.md)
