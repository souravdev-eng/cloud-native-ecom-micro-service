#!/usr/bin/env node

/**
 * Work Queue Pattern - Task Sender
 * Distributes time-consuming tasks among multiple workers
 */

const amqp = require('amqplib');

const RABBITMQ_URL = 'amqp://admin:admin123@localhost:5672';
const QUEUE_NAME = 'task_queue';

async function sendTasks() {
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

    console.log('🚀 Work Queue Task Sender\n');
    console.log('================================\n');

    // Generate tasks
    const tasks = [
      { id: 1, task: 'Process image resize', difficulty: 3 },
      { id: 2, task: 'Send email notification', difficulty: 1 },
      { id: 3, task: 'Generate PDF report', difficulty: 5 },
      { id: 4, task: 'Backup database', difficulty: 4 },
      { id: 5, task: 'Clear cache', difficulty: 1 },
      { id: 6, task: 'Analyze logs', difficulty: 3 },
      { id: 7, task: 'Compress video', difficulty: 5 },
      { id: 8, task: 'Index search data', difficulty: 2 },
    ];

    for (const task of tasks) {
      const message = Buffer.from(JSON.stringify(task));

      channel.sendToQueue(QUEUE_NAME, message, {
        persistent: true,
      });

      console.log(`📤 Task sent: ${task.task} (difficulty: ${'⭐'.repeat(task.difficulty)})`);
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    console.log('\n✅ All tasks sent to queue');
    console.log('💡 Start multiple workers to process tasks in parallel');

    setTimeout(async () => {
      await channel.close();
      await connection.close();
      process.exit(0);
    }, 500);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

sendTasks();
