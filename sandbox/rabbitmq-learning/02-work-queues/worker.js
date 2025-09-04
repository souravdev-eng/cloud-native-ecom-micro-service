#!/usr/bin/env node

/**
 * Work Queue Pattern - Worker
 * Processes tasks from the queue
 * Run multiple instances to see load balancing
 */

const amqp = require('amqplib');

const RABBITMQ_URL = 'amqp://admin:admin123@localhost:5672';
const QUEUE_NAME = 'task_queue';

// Generate random worker ID
const WORKER_ID = `Worker-${Math.floor(Math.random() * 1000)}`;

async function startWorker() {
  let connection;
  let channel;

  try {
    // Connect to RabbitMQ
    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();

    // Declare durable queue
    await channel.assertQueue(QUEUE_NAME, {
      durable: true,
    });

    // Fair dispatch - don't give more than 1 message to a worker at a time
    channel.prefetch(1);

    console.log(`🤖 ${WORKER_ID} Started\n`);
    console.log('================================\n');
    console.log('⏳ Waiting for tasks. Press CTRL+C to exit\n');

    // Consume messages
    await channel.consume(
      QUEUE_NAME,
      async (msg) => {
        if (msg !== null) {
          const task = JSON.parse(msg.content.toString());

          console.log(`📥 [${WORKER_ID}] Received task: ${task.task}`);
          console.log(`   Difficulty: ${'⭐'.repeat(task.difficulty)}`);

          // Simulate work based on difficulty
          const processingTime = task.difficulty * 1000;
          console.log(`   Processing for ${task.difficulty} seconds...`);

          // Show progress
          for (let i = 1; i <= task.difficulty; i++) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            console.log(
              `   Progress: [${'█'.repeat(i)}${' '.repeat(task.difficulty - i)}] ${i}/${
                task.difficulty
              }s`
            );
          }

          // Acknowledge completion
          channel.ack(msg);
          console.log(`   ✅ Task completed!\n`);
        }
      },
      {
        noAck: false,
      }
    );

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log(`\n🛑 ${WORKER_ID} shutting down...`);
      await channel.close();
      await connection.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

startWorker();
