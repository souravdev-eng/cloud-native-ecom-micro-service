#!/usr/bin/env node

const amqp = require('amqplib');

// Configuration
const RABBITMQ_URL = 'amqp://admin:admin123@localhost:5672';
const QUEUE_NAME = 'hello_queue';

async function publishMessage() {
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

    // 4. Send messages
    console.log('\n📤 Sending messages...\n');

    // Send multiple messages with different content
    const messages = [
      { id: 1, text: 'Hello RabbitMQ!', timestamp: new Date().toISOString() },
      { id: 2, text: 'This is a test message', timestamp: new Date().toISOString() },
      { id: 3, text: 'Learning message queues', timestamp: new Date().toISOString() },
      { id: 4, text: 'Node.js with RabbitMQ', timestamp: new Date().toISOString() },
      { id: 5, text: 'Final message', timestamp: new Date().toISOString() },
    ];

    for (const msg of messages) {
      const messageBuffer = Buffer.from(JSON.stringify(msg));

      // Send message to queue
      const sent = channel.sendToQueue(QUEUE_NAME, messageBuffer, {
        persistent: true, // Message survives broker restart
      });

      if (sent) {
        console.log(`✅ Message sent: ${JSON.stringify(msg)}`);
      } else {
        console.log(`❌ Failed to send message: ${JSON.stringify(msg)}`);
      }

      // Small delay between messages
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log('\n✨ All messages sent successfully!');

    // 5. Close connection
    setTimeout(async () => {
      await channel.close();
      await connection.close();
      console.log('👋 Connection closed');
      process.exit(0);
    }, 1000);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (channel) await channel.close();
    if (connection) await connection.close();
    process.exit(1);
  }
}

// Run the publisher
console.log('🚀 RabbitMQ Basic Publisher Started\n');
console.log('================================\n');
publishMessage();
