#!/usr/bin/env node

/**
 * Idempotency Publisher
 * Demonstrates publishing messages with unique IDs for idempotent processing
 */

const amqp = require('amqplib');
const { v4: uuidv4 } = require('uuid');

// Configuration
const RABBITMQ_URL = 'amqp://admin:admin123@localhost:5672';
const EXCHANGE_NAME = 'payment_processing';
const QUEUE_NAME = 'payment_queue';

async function setupInfrastructure(channel) {
  console.log('🏗️  Setting up infrastructure...');

  // Create exchange
  await channel.assertExchange(EXCHANGE_NAME, 'direct', { durable: true });
  console.log(`   ✅ Exchange "${EXCHANGE_NAME}" created`);

  // Create queue
  await channel.assertQueue(QUEUE_NAME, { durable: true });
  await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, 'payment');
  console.log(`   ✅ Queue "${QUEUE_NAME}" created and bound`);

  console.log('🎉 Infrastructure setup complete!\n');
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

    // Generate payment messages with idempotency keys
    const basePayments = [
      {
        customerId: 'CUST-001',
        amount: 99.99,
        currency: 'USD',
        paymentMethod: 'credit_card',
        cardLast4: '1234',
      },
      {
        customerId: 'CUST-002',
        amount: 45.5,
        currency: 'USD',
        paymentMethod: 'paypal',
        paypalEmail: 'user@example.com',
      },
      {
        customerId: 'CUST-003',
        amount: 199.99,
        currency: 'USD',
        paymentMethod: 'bank_transfer',
        accountLast4: '5678',
      },
    ];

    console.log('📤 Publishing payment messages (including duplicates)...\n');

    const allMessages = [];

    // Create original messages
    for (let i = 0; i < basePayments.length; i++) {
      const payment = basePayments[i];
      const idempotencyKey = uuidv4(); // Unique key for each payment

      const message = {
        id: `PAY-${String(i + 1).padStart(3, '0')}`,
        idempotencyKey: idempotencyKey,
        ...payment,
        timestamp: new Date().toISOString(),
        version: 1,
      };

      allMessages.push(message);
    }

    // Create duplicate messages (same idempotency keys)
    console.log('🔄 Adding duplicate messages to test idempotency...\n');

    // Duplicate the first payment (same idempotency key)
    const duplicatePayment1 = {
      ...allMessages[0],
      id: `PAY-001-DUPLICATE-1`,
      timestamp: new Date().toISOString(),
      version: 2, // Different version but same idempotency key
    };
    allMessages.push(duplicatePayment1);

    // Another duplicate of the first payment
    const duplicatePayment1Again = {
      ...allMessages[0],
      id: `PAY-001-DUPLICATE-2`,
      timestamp: new Date().toISOString(),
      version: 3,
    };
    allMessages.push(duplicatePayment1Again);

    // Duplicate the second payment
    const duplicatePayment2 = {
      ...allMessages[1],
      id: `PAY-002-DUPLICATE`,
      timestamp: new Date().toISOString(),
      amount: 50.0, // Different amount but same idempotency key
    };
    allMessages.push(duplicatePayment2);

    // Publish all messages (originals + duplicates)
    for (let i = 0; i < allMessages.length; i++) {
      const message = allMessages[i];
      const messageBuffer = Buffer.from(JSON.stringify(message));

      const published = channel.publish(EXCHANGE_NAME, 'payment', messageBuffer, {
        persistent: true,
        messageId: message.id,
        timestamp: Date.now(),
        headers: {
          'idempotency-key': message.idempotencyKey,
          'message-version': message.version || 1,
          'customer-id': message.customerId,
        },
      });

      if (published) {
        const isDuplicate = message.id.includes('DUPLICATE');
        const icon = isDuplicate ? '🔄' : '✅';
        const label = isDuplicate ? 'DUPLICATE' : 'ORIGINAL';

        console.log(`${icon} Published [${label}]: ${message.id}`);
        console.log(`   Idempotency Key: ${message.idempotencyKey.substring(0, 8)}...`);
        console.log(`   Customer: ${message.customerId}, Amount: $${message.amount}`);
        console.log(`   Payment Method: ${message.paymentMethod}\n`);
      } else {
        console.log(`❌ Failed to publish: ${message.id}\n`);
      }

      // Small delay between messages
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log('📊 Summary:');
    console.log(`   Total messages published: ${allMessages.length}`);
    console.log(`   Original messages: 3`);
    console.log(`   Duplicate messages: ${allMessages.length - 3}`);
    console.log('\n💡 Expected behavior:');
    console.log('   - Only 3 payments should be processed (duplicates ignored)');
    console.log('   - Consumer will use Redis to track processed idempotency keys');
    console.log('   - Duplicate messages will be acknowledged but not processed');
    console.log('\n🚀 Start the consumer to see idempotency in action!');

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
console.log('🚀 Idempotency Publisher Started\n');
console.log('=================================\n');
publishMessages();
