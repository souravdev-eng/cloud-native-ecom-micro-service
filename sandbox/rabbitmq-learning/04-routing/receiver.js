#!/usr/bin/env node

/**
 * Routing Pattern - Receiver
 * Receives messages based on routing key binding
 * Usage: node receiver.js [info] [warning] [error]
 */

const amqp = require('amqplib');

const RABBITMQ_URL = 'amqp://admin:admin123@localhost:5672';
const EXCHANGE_NAME = 'direct_logs';
const EXCHANGE_TYPE = 'direct';

// Get severities from command line arguments
const severities = process.argv.slice(2);
if (severities.length === 0) {
  console.log('Usage: node receiver.js [info] [warning] [error]');
  console.log('Example: node receiver.js warning error');
  process.exit(1);
}

async function receiveDirectMessages() {
  let connection;
  let channel;

  try {
    // Connect to RabbitMQ
    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();

    // Declare direct exchange
    await channel.assertExchange(EXCHANGE_NAME, EXCHANGE_TYPE, {
      durable: false,
    });

    // Create exclusive queue
    const q = await channel.assertQueue('', {
      exclusive: true,
    });

    console.log('🎯 Direct Routing Receiver\n');
    console.log('================================\n');
    console.log(`Exchange: ${EXCHANGE_NAME} (${EXCHANGE_TYPE})`);
    console.log(`Queue: ${q.queue}`);
    console.log(`Subscribed to: ${severities.join(', ')}\n`);
    console.log('👂 Waiting for messages. Press CTRL+C to exit\n');

    // Bind queue to exchange for each severity
    for (const severity of severities) {
      await channel.bindQueue(q.queue, EXCHANGE_NAME, severity);
    }

    // Consume messages
    await channel.consume(
      q.queue,
      (msg) => {
        if (msg !== null) {
          const message = JSON.parse(msg.content.toString());
          const routingKey = msg.fields.routingKey;

          const icon = routingKey === 'error' ? '🔴' : routingKey === 'warning' ? '🟡' : '🔵';

          console.log(`📨 Received [${routingKey}]:`);
          console.log(`   ${icon} ${message.message}`);
          console.log(`   Time: ${message.timestamp}`);
          console.log(`   Source: ${message.source}\n`);
        }
      },
      {
        noAck: true,
      }
    );

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Receiver shutting down...');
      await channel.close();
      await connection.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

receiveDirectMessages();
