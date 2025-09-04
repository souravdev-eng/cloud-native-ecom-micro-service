#!/usr/bin/env node

/**
 * Publish/Subscribe Pattern - Subscriber
 * Receives all messages from FANOUT exchange
 * Run multiple instances to see all get the same messages
 */

const amqp = require('amqplib');

const RABBITMQ_URL = 'amqp://admin:admin123@localhost:5672';
const EXCHANGE_NAME = 'logs_fanout';
const EXCHANGE_TYPE = 'fanout';

// Generate random subscriber ID
const SUBSCRIBER_ID = `Subscriber-${Math.floor(Math.random() * 1000)}`;

async function subscribeLogs() {
  let connection;
  let channel;

  try {
    // Connect to RabbitMQ
    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();

    // Declare fanout exchange
    await channel.assertExchange(EXCHANGE_NAME, EXCHANGE_TYPE, {
      durable: false,
    });

    // Create exclusive queue for this subscriber
    const q = await channel.assertQueue('', {
      exclusive: true, // Delete queue when subscriber disconnects
    });

    console.log(`📻 ${SUBSCRIBER_ID} Started\n`);
    console.log('================================\n');
    console.log(`Exchange: ${EXCHANGE_NAME} (${EXCHANGE_TYPE})`);
    console.log(`Queue: ${q.queue} (exclusive)\n`);
    console.log('👂 Listening for broadcasts. Press CTRL+C to exit\n');

    // Bind queue to exchange
    await channel.bindQueue(q.queue, EXCHANGE_NAME, '');

    // Consume messages
    await channel.consume(
      q.queue,
      (msg) => {
        if (msg !== null) {
          const logMessage = JSON.parse(msg.content.toString());

          // Color code based on log level
          const levelColors = {
            INFO: '🔵',
            WARNING: '🟡',
            ERROR: '🔴',
            DEBUG: '🟢',
          };

          console.log(`📨 [${SUBSCRIBER_ID}] Received broadcast:`);
          console.log(`   ${levelColors[logMessage.level]} Level: ${logMessage.level}`);
          console.log(`   Service: ${logMessage.service}`);
          console.log(`   Message: ${logMessage.message}`);
          console.log(`   Time: ${logMessage.timestamp}`);
          console.log(`   Details: ${logMessage.details}\n`);
        }
      },
      {
        noAck: true, // Auto acknowledge
      }
    );

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log(`\n🛑 ${SUBSCRIBER_ID} shutting down...`);
      await channel.close();
      await connection.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

subscribeLogs();
