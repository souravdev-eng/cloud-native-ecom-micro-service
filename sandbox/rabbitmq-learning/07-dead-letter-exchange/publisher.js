#!/usr/bin/env node

/**
 * Dead Letter Exchange (DLX) Publisher
 * Demonstrates publishing messages that can fail and be routed to DLX
 */

const amqp = require('amqplib');

// Configuration
const RABBITMQ_URL = 'amqp://admin:admin123@localhost:5672';
const MAIN_EXCHANGE = 'order_processing';
const DLX_EXCHANGE = 'order_processing_dlx';
const MAIN_QUEUE = 'order_queue';
const DLX_QUEUE = 'order_dlx_queue';
const RETRY_QUEUE = 'order_retry_queue';

async function setupInfrastructure(channel) {
  console.log('🏗️  Setting up DLX infrastructure...');

  // 1. Create Dead Letter Exchange
  await channel.assertExchange(DLX_EXCHANGE, 'direct', { durable: true });
  console.log(`   ✅ Dead Letter Exchange "${DLX_EXCHANGE}" created`);

  // 2. Create Main Exchange
  await channel.assertExchange(MAIN_EXCHANGE, 'direct', { durable: true });
  console.log(`   ✅ Main Exchange "${MAIN_EXCHANGE}" created`);

  // 3. Create Dead Letter Queue
  await channel.assertQueue(DLX_QUEUE, {
    durable: true,
    arguments: {
      // Messages in DLX queue expire after 30 seconds and go back to retry
      'x-message-ttl': 30000, // 30 seconds
      'x-dead-letter-exchange': MAIN_EXCHANGE,
      'x-dead-letter-routing-key': 'retry',
    },
  });
  await channel.bindQueue(DLX_QUEUE, DLX_EXCHANGE, 'failed');
  console.log(`   ✅ Dead Letter Queue "${DLX_QUEUE}" created and bound`);

  // 4. Create Retry Queue (for messages coming back from DLX)
  await channel.assertQueue(RETRY_QUEUE, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': DLX_EXCHANGE,
      'x-dead-letter-routing-key': 'failed',
    },
  });
  await channel.bindQueue(RETRY_QUEUE, MAIN_EXCHANGE, 'retry');
  console.log(`   ✅ Retry Queue "${RETRY_QUEUE}" created and bound`);

  // 5. Create Main Queue
  await channel.assertQueue(MAIN_QUEUE, {
    durable: true,
    arguments: {
      // When messages are rejected/nacked, send to DLX
      'x-dead-letter-exchange': DLX_EXCHANGE,
      'x-dead-letter-routing-key': 'failed',
    },
  });
  await channel.bindQueue(MAIN_QUEUE, MAIN_EXCHANGE, 'process');
  console.log(`   ✅ Main Queue "${MAIN_QUEUE}" created and bound`);

  console.log('🎉 DLX infrastructure setup complete!\n');
}

async function publishMessages() {
  let connection;
  let channel;

  try {
    // Connect to RabbitMQ
    console.log('🔌 Connecting to RabbitMQ...');
    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    console.log('📡 Channel created\n');

    // Setup infrastructure
    await setupInfrastructure(channel);

    // Sample order messages with different scenarios
    const orders = [
      {
        id: 'ORD-001',
        customerId: 'CUST-123',
        items: [{ productId: 'PROD-456', quantity: 2, price: 29.99 }],
        total: 59.98,
        type: 'success', // This will process successfully
        timestamp: new Date().toISOString(),
        retryCount: 0,
      },
      {
        id: 'ORD-002',
        customerId: 'CUST-124',
        items: [{ productId: 'PROD-789', quantity: 1, price: 15.5 }],
        total: 15.5,
        type: 'temporary_fail', // This will fail temporarily and retry
        timestamp: new Date().toISOString(),
        retryCount: 0,
      },
      {
        id: 'ORD-003',
        customerId: 'CUST-125',
        items: [{ productId: 'PROD-999', quantity: 3, price: 99.99 }],
        total: 299.97,
        type: 'poison', // This will always fail (poison message)
        timestamp: new Date().toISOString(),
        retryCount: 0,
      },
      {
        id: 'ORD-004',
        customerId: 'CUST-126',
        items: [{ productId: 'PROD-111', quantity: 1, price: 5.99 }],
        total: 5.99,
        type: 'success',
        timestamp: new Date().toISOString(),
        retryCount: 0,
      },
    ];

    console.log('📤 Publishing order messages...\n');

    for (const order of orders) {
      const messageBuffer = Buffer.from(JSON.stringify(order));

      // Publish to main exchange with 'process' routing key
      const published = channel.publish(MAIN_EXCHANGE, 'process', messageBuffer, {
        persistent: true,
        messageId: order.id,
        timestamp: Date.now(),
        headers: {
          'x-retry-count': order.retryCount,
          'x-original-routing-key': 'process',
        },
      });

      if (published) {
        console.log(`✅ Published order: ${order.id} (${order.type})`);
        console.log(`   Customer: ${order.customerId}, Total: $${order.total}`);
        console.log(`   Items: ${order.items.length}, Retry Count: ${order.retryCount}\n`);
      } else {
        console.log(`❌ Failed to publish order: ${order.id}\n`);
      }

      // Small delay between messages
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log('🎉 All messages published!');
    console.log('\n📝 Message Flow:');
    console.log('   1. Messages go to main queue for processing');
    console.log('   2. Failed messages are sent to Dead Letter Exchange');
    console.log('   3. After TTL expires, they retry from DLX');
    console.log('   4. Poison messages eventually stay in DLX for manual review');
    console.log('\n💡 Start the consumer to see the DLX pattern in action!');

    // Close connection after a delay
    setTimeout(async () => {
      await channel.close();
      await connection.close();
      console.log('\n👋 Connection closed');
      process.exit(0);
    }, 2000);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (channel) await channel.close();
    if (connection) await connection.close();
    process.exit(1);
  }
}

// Run the publisher
console.log('🚀 Dead Letter Exchange Publisher Started\n');
console.log('==========================================\n');
publishMessages();
