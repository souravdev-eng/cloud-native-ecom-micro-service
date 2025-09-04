#!/usr/bin/env node

/**
 * Routing Pattern - Sender
 * Uses DIRECT exchange to route messages based on routing key
 */

const amqp = require('amqplib');

const RABBITMQ_URL = 'amqp://admin:admin123@localhost:5672';
const EXCHANGE_NAME = 'direct_logs';
const EXCHANGE_TYPE = 'direct';

async function sendDirectMessages() {
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

    console.log('🎯 Direct Routing Sender\n');
    console.log('================================\n');
    console.log(`Exchange: ${EXCHANGE_NAME} (${EXCHANGE_TYPE})\n`);

    // Messages with different severities (routing keys)
    const messages = [
      { severity: 'info', message: 'Application started successfully' },
      { severity: 'warning', message: 'Memory usage above 70%' },
      { severity: 'error', message: 'Database connection failed' },
      { severity: 'info', message: 'User logged in' },
      { severity: 'error', message: 'Payment processing failed' },
      { severity: 'warning', message: 'API rate limit approaching' },
      { severity: 'info', message: 'Backup completed' },
      { severity: 'error', message: 'File not found' },
      { severity: 'warning', message: 'Deprecated API endpoint used' },
      { severity: 'info', message: 'Cache cleared successfully' },
    ];

    console.log('📤 Sending messages with routing keys:\n');

    for (const msg of messages) {
      const fullMessage = {
        timestamp: new Date().toISOString(),
        severity: msg.severity,
        message: msg.message,
        source: 'routing-demo',
      };

      const buffer = Buffer.from(JSON.stringify(fullMessage));

      // Publish with routing key (severity)
      channel.publish(EXCHANGE_NAME, msg.severity, buffer);

      const icon = msg.severity === 'error' ? '🔴' : msg.severity === 'warning' ? '🟡' : '🔵';

      console.log(`${icon} Sent [${msg.severity}]: ${msg.message}`);

      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    console.log('\n✅ All messages sent with routing keys');
    console.log('💡 Receivers can subscribe to specific severities (info, warning, error)');

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

sendDirectMessages();
