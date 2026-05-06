# 02 - Work Queues (Task Distribution) 👷

> Distribute time-consuming tasks among multiple workers for parallel processing.

---

## 🎯 What You'll Learn

- Fair dispatch with `prefetch`
- Load balancing across workers
- Handling tasks of varying complexity
- Scaling workers dynamically

---

## 🍕 Real-World Analogy: Pizza Kitchen

```
                              ┌──────────────┐
                          ┌──►│   Worker 1   │ 🍕 Makes Pizza
┌───────────────┐         │   │  (Chef #1)   │
│               │         │   └──────────────┘
│  Order Queue  │─────────┤
│  (Task Queue) │         │   ┌──────────────┐
│               │         ├──►│   Worker 2   │ 🍕 Makes Pizza
└───────────────┘         │   │  (Chef #2)   │
     ▲                    │   └──────────────┘
     │                    │
┌────┴────┐               │   ┌──────────────┐
│ Orders  │               └──►│   Worker 3   │ 🍕 Makes Pizza
│ Coming  │                   │  (Chef #3)   │
│   In    │                   └──────────────┘
└─────────┘
```

**Scenario**: A pizza restaurant with multiple chefs. Orders go into a queue, and chefs pick them up as they become free. A chef making a complex pizza doesn't block others from taking simpler orders.

**Key Points**:

- Multiple workers share the workload
- Each task is processed by ONE worker only
- Busy workers don't take new tasks until ready

---

## 🏪 E-Commerce Project Example

### Order Processing Pipeline

Multiple order service workers process incoming orders:

```
                                    ┌─────────────────────┐
                                ┌──►│  Order Worker #1    │──► Process Order
   ┌──────────┐    ┌─────────┐  │   │  (Image resize)     │    ├── Validate
   │  Client  │───►│  task   │──┤   └─────────────────────┘    ├── Update DB
   │ Checkout │    │ _queue  │  │   ┌─────────────────────┐    └── Notify
   └──────────┘    └─────────┘  ├──►│  Order Worker #2    │
                                │   │  (Generate invoice) │
                                │   └─────────────────────┘
                                │   ┌─────────────────────┐
                                └──►│  Order Worker #3    │
                                    │  (Send confirmation)│
                                    └─────────────────────┘
```

**Why Work Queues here?**

- Black Friday sale = 1000s of orders
- Some orders take longer (large items, multiple payments)
- Scale workers up/down based on load
- No order is processed twice

---

## 🔬 How It Works

### Round-Robin vs Fair Dispatch

#### Round-Robin (Without Prefetch)

```
Message 1 ──► Worker 1 (busy for 10s)
Message 2 ──► Worker 2 (busy for 1s)
Message 3 ──► Worker 1 (waiting...)  ← Stuck waiting!
Message 4 ──► Worker 2 (done, takes it)
Message 5 ──► Worker 1 (still waiting...)
```

**Problem**: Worker 1 might be slow, but still gets assigned tasks.

#### Fair Dispatch (With Prefetch = 1)

```
Message 1 ──► Worker 1 (busy for 10s)
Message 2 ──► Worker 2 (busy for 1s)
Message 3 ──► Worker 2 (done, takes it!)  ← Goes to free worker
Message 4 ──► Worker 2 (done, takes it!)
Message 5 ──► Worker 1 (finally done, takes it)
```

**Solution**: Only give a task to workers who are actually free.

### The Magic: `prefetch(1)`

```javascript
channel.prefetch(1);
// "Don't give me more than 1 message until I acknowledge"
```

---

## 💻 Code Walkthrough

### Task Sender

```javascript
// Declare durable queue
await channel.assertQueue('task_queue', { durable: true });

// Tasks with varying difficulty
const tasks = [
  { id: 1, task: 'Process image resize', difficulty: 3 },
  { id: 2, task: 'Send email notification', difficulty: 1 },
  { id: 3, task: 'Generate PDF report', difficulty: 5 },
];

// Send each task
for (const task of tasks) {
  channel.sendToQueue('task_queue', Buffer.from(JSON.stringify(task)), {
    persistent: true,
  });
  console.log(`Sent: ${task.task} (difficulty: ${task.difficulty})`);
}
```

### Worker (Consumer)

```javascript
// Unique worker ID
const WORKER_ID = `Worker-${Math.floor(Math.random() * 1000)}`;

await channel.assertQueue('task_queue', { durable: true });

// ⭐ KEY: Fair dispatch - only 1 message at a time
channel.prefetch(1);

await channel.consume(
  'task_queue',
  async (msg) => {
    const task = JSON.parse(msg.content.toString());

    console.log(`[${WORKER_ID}] Processing: ${task.task}`);

    // Simulate work based on difficulty
    const processingTime = task.difficulty * 1000;
    await new Promise((resolve) => setTimeout(resolve, processingTime));

    // Acknowledge when done
    channel.ack(msg);
    console.log(`[${WORKER_ID}] ✅ Completed: ${task.task}`);
  },
  {
    noAck: false,
  }
);
```

---

## 🧪 Try It Yourself

### Terminal 1 - Start Worker 1

```bash
node 02-work-queues/worker.js
```

### Terminal 2 - Start Worker 2

```bash
node 02-work-queues/worker.js
```

### Terminal 3 - Send Tasks

```bash
node 02-work-queues/sender.js
```

### Watch the Magic! ✨

```
# Worker 1 Output:
📥 [Worker-123] Received task: Process image resize
   Difficulty: ⭐⭐⭐
   Progress: [█  ] 1/3s
   Progress: [██ ] 2/3s
   Progress: [███] 3/3s
   ✅ Task completed!

# Worker 2 Output (processes more because it's faster):
📥 [Worker-456] Received task: Send email notification
   Difficulty: ⭐
   ✅ Task completed!
📥 [Worker-456] Received task: Clear cache
   Difficulty: ⭐
   ✅ Task completed!
```

---

## 📊 Visual: Fair Dispatch in Action

```
Time  │ Queue: [Task1, Task2, Task3, Task4, Task5, Task6, Task7, Task8]
──────┼─────────────────────────────────────────────────────────────────
0s    │ Worker1 takes Task1 (5s job) ████████████████████
      │ Worker2 takes Task2 (1s job) ████
──────┼─────────────────────────────────────────────────────────────────
1s    │ Worker1 still on Task1       ░░░░████████████████
      │ Worker2 done! Takes Task3    ████
──────┼─────────────────────────────────────────────────────────────────
2s    │ Worker1 still on Task1       ░░░░░░░░████████████
      │ Worker2 done! Takes Task4    ████
──────┼─────────────────────────────────────────────────────────────────
3s    │ Worker1 still on Task1       ░░░░░░░░░░░░████████
      │ Worker2 done! Takes Task5    ████
──────┼─────────────────────────────────────────────────────────────────
5s    │ Worker1 done! Takes Task6    ████████
      │ Worker2 on Task5             ░░░░████

Result: Worker2 processed 4 tasks while Worker1 did 2
        = Efficient load balancing!
```

---

## 🎓 Key Takeaways

| Concept                 | Remember                           |
| ----------------------- | ---------------------------------- |
| **prefetch(1)**         | Don't overload slow workers        |
| **Persistent messages** | Tasks survive restarts             |
| **Multiple workers**    | Scale horizontally                 |
| **Acknowledgment**      | Only ack after complete processing |

---

## 🔗 In Our Codebase

Work queue patterns in our project:

```
order/src/queues/     → Order processing workers
etl-service/src/      → ETL job processing
product/src/queues/   → Product sync tasks
```

---

## 💡 Production Tips

### Scaling Workers

```bash
# During high traffic (Black Friday)
for i in {1..10}; do
  node worker.js &
done

# Normal traffic
for i in {1..2}; do
  node worker.js &
done
```

### Prefetch Tuning

| Prefetch | Use Case                               |
| -------- | -------------------------------------- |
| `1`      | CPU-intensive tasks, fair distribution |
| `10`     | Fast tasks, network-bound processing   |
| `0`      | Unlimited (not recommended)            |

---

## ❓ Quick Quiz

1. What happens without `prefetch(1)`?
2. Can two workers process the same message?
3. How do you scale this pattern?

<details>
<summary>Answers</summary>

1. RabbitMQ uses round-robin, slow workers get overloaded
2. No, each message goes to exactly ONE worker
3. Just start more worker processes!

</details>

---

[← Basic Queue](./01-basic-queue.md) | [Next: Publish/Subscribe →](./03-publish-subscribe.md)
