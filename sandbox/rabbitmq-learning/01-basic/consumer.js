#!/usr/bin/env node

const amqp = require('amqplib');

// Configuration
const RABBITMQ_URL = 'amqp://admin:admin123@localhost:5672';
const QUEUE_NAME = 'hello_queue';

async function consumeMessages() {
  let connection;
  let channel;

  try {
    // 1. Create connection to RabbitMQ
    console.log('🔌 Connecting to RabbitMQ...');
    connection = await amqp.connect(RABBITMQ_URL);

    // 2. Create a channel
    channel = await connection.createChannel();
    console.log('📡 Channel created');

    // 3. Assert/Declare a queue (creates if doesn't exist)
    await channel.assertQueue(QUEUE_NAME, {
      durable: true, // Queue survives broker restart
    });
    console.log(`📦 Queue "${QUEUE_NAME}" is ready`);

    // 4. Set prefetch (how many messages to process at once)
    channel.prefetch(1); // Process one message at a time
    console.log('⚙️  Prefetch set to 1 (process one message at a time)');

    // 5. Start consuming messages
    console.log('\n👂 Waiting for messages...\n');
    console.log('Press CTRL+C to exit\n');
    console.log('================================\n');

    await channel.consume(
      QUEUE_NAME,
      async (message) => {
        if (message !== null) {
          // Parse the message content
          const content = message.content.toString();
          const messageData = JSON.parse(content);

          console.log(`📨 Received message:`);
          console.log(`   ID: ${messageData.id}`);
          console.log(`   Text: ${messageData.text}`);
          console.log(`   Timestamp: ${messageData.timestamp}`);
          console.log(`   Raw: ${content}`);

          // Simulate processing time
          const processingTime = Math.random() * 2000 + 1000; // 1-3 seconds
          console.log(`   ⏳ Processing (${(processingTime / 1000).toFixed(1)}s)...`);

          await new Promise((resolve) => setTimeout(resolve, processingTime));

          // Acknowledge the message (remove from queue)
          channel.ack(message);
          console.log(`   ✅ Message processed and acknowledged\n`);
        }
      },
      {
        noAck: false, // Manual acknowledgment mode
      }
    );

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n\n🛑 Shutting down gracefully...');
      try {
        await channel.close();
        await connection.close();
        console.log('👋 Connection closed');
        process.exit(0);
      } catch (err) {
        console.error('Error during shutdown:', err);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (channel) await channel.close();
    if (connection) await connection.close();
    process.exit(1);
  }
}

// Run the consumer
console.log('🚀 RabbitMQ Basic Consumer Started\n');
console.log('================================\n');
consumeMessages();
