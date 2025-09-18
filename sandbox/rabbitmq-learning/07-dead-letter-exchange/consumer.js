#!/usr/bin/env node

/**
 * Dead Letter Exchange (DLX) Consumer
 * Demonstrates consuming messages with retry logic and DLX handling
 */

const amqp = require('amqplib');

// Configuration
const RABBITMQ_URL = 'amqp://admin:admin123@localhost:5672';
const MAIN_EXCHANGE = 'order_processing';
const DLX_EXCHANGE = 'order_processing_dlx';
const MAIN_QUEUE = 'order_queue';
const DLX_QUEUE = 'order_dlx_queue';
const RETRY_QUEUE = 'order_retry_queue';

const MAX_RETRY_COUNT = 3;

// Simulate different processing scenarios
async function processOrder(order, retryCount) {
  console.log(`🔄 Processing order ${order.id} (attempt ${retryCount + 1}/${MAX_RETRY_COUNT + 1})`);
  console.log(`   Type: ${order.type}, Customer: ${order.customerId}, Total: $${order.total}`);

  // Simulate processing time
  await new Promise((resolve) => setTimeout(resolve, 1000));

  switch (order.type) {
    case 'success':
      console.log(`   ✅ Order ${order.id} processed successfully!`);
      return { success: true };

    case 'temporary_fail':
      if (retryCount < 2) {
        // Fail first 2 attempts, succeed on 3rd
        console.log(`   ⚠️  Temporary failure for order ${order.id} (will retry)`);
        throw new Error('Temporary processing failure - payment service unavailable');
      } else {
        console.log(`   ✅ Order ${order.id} processed successfully on retry!`);
        return { success: true };
      }

    case 'poison':
      console.log(`   💀 Poison message - order ${order.id} will always fail`);
      throw new Error('Invalid order data - cannot process');

    default:
      throw new Error('Unknown order type');
  }
}

async function setupConsumer() {
  let connection;
  let channel;

  try {
    // Connect to RabbitMQ
    console.log('🔌 Connecting to RabbitMQ...');
    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    console.log('📡 Channel created');

    // Set prefetch to process one message at a time
    channel.prefetch(1);
    console.log('⚙️  Prefetch set to 1\n');

    console.log('👂 Starting consumers...\n');
    console.log('Press CTRL+C to exit\n');
    console.log('================================\n');

    // Consumer for main queue
    await channel.consume(
      MAIN_QUEUE,
      async (message) => {
        if (message !== null) {
          await handleMessage(channel, message, 'MAIN');
        }
      },
      { noAck: false }
    );

    // Consumer for retry queue
    await channel.consume(
      RETRY_QUEUE,
      async (message) => {
        if (message !== null) {
          await handleMessage(channel, message, 'RETRY');
        }
      },
      { noAck: false }
    );

    console.log('🎯 Consumers are running and waiting for messages...\n');

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

async function handleMessage(channel, message, queueType) {
  const content = message.content.toString();
  const order = JSON.parse(content);
  const retryCount = parseInt(message.properties.headers['x-retry-count'] || 0);
  const messageId = message.properties.messageId || order.id;

  console.log(`📨 [${queueType}] Received message: ${messageId}`);
  console.log(`   Retry count: ${retryCount}/${MAX_RETRY_COUNT}`);
  console.log(`   Delivery tag: ${message.fields.deliveryTag}`);

  try {
    // Attempt to process the order
    const result = await processOrder(order, retryCount);

    if (result.success) {
      // Acknowledge successful processing
      channel.ack(message);
      console.log(`   ✅ [${queueType}] Message ${messageId} acknowledged and completed\n`);
    }
  } catch (error) {
    console.log(`   ❌ [${queueType}] Processing failed: ${error.message}`);

    if (retryCount >= MAX_RETRY_COUNT) {
      // Max retries reached - send to DLX permanently
      console.log(`   💀 [${queueType}] Max retries (${MAX_RETRY_COUNT}) reached for ${messageId}`);
      console.log(
        `   🏴‍☠️ [${queueType}] Message ${messageId} will be sent to DLX for manual review`
      );

      // Reject without requeue (goes to DLX)
      channel.nack(message, false, false);
      console.log(`   📤 [${queueType}] Message ${messageId} rejected and sent to DLX\n`);
    } else {
      // Increment retry count and reject (will go to DLX, then retry after TTL)
      const newRetryCount = retryCount + 1;
      console.log(
        `   🔄 [${queueType}] Scheduling retry ${newRetryCount}/${MAX_RETRY_COUNT} for ${messageId}`
      );

      // Update retry count in headers
      message.properties.headers['x-retry-count'] = newRetryCount;

      // Reject without requeue (goes to DLX for retry after TTL)
      channel.nack(message, false, false);
      console.log(`   ⏰ [${queueType}] Message ${messageId} will retry after TTL expires\n`);
    }
  }
}

// Monitor DLX queue (optional monitoring function)
async function monitorDLX() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    // Check DLX queue periodically
    setInterval(async () => {
      try {
        const queueInfo = await channel.checkQueue(DLX_QUEUE);
        if (queueInfo.messageCount > 0) {
          console.log(`\n🚨 DLX Alert: ${queueInfo.messageCount} messages in Dead Letter Queue`);
          console.log('   These messages need manual review and intervention\n');
        }
      } catch (err) {
        // Queue might not exist yet, ignore
      }
    }, 10000); // Check every 10 seconds
  } catch (error) {
    console.log('DLX monitoring not available:', error.message);
  }
}

// Run the consumer
console.log('🚀 Dead Letter Exchange Consumer Started\n');
console.log('=========================================\n');

// Start monitoring DLX in background
monitorDLX();

// Start main consumer
setupConsumer();
