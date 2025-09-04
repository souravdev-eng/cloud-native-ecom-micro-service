#!/usr/bin/env node

/**
 * Topic Pattern - Sender
 * Uses TOPIC exchange for pattern-based routing
 * Routing key format: <facility>.<severity>
 */

const amqp = require('amqplib');

const RABBITMQ_URL = 'amqp://admin:admin123@localhost:5672';
const EXCHANGE_NAME = 'topic_logs';
const EXCHANGE_TYPE = 'topic';

async function sendTopicMessages() {
  let connection;
  let channel;

  try {
    // Connect to RabbitMQ
    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();

    // Declare topic exchange
    await channel.assertExchange(EXCHANGE_NAME, EXCHANGE_TYPE, {
      durable: false,
    });

    console.log('🌐 Topic Exchange Sender\n');
    console.log('================================\n');
    console.log(`Exchange: ${EXCHANGE_NAME} (${EXCHANGE_TYPE})\n`);
    console.log('Routing key format: <facility>.<severity>\n');

    // Messages with topic routing keys
    const messages = [
      { routingKey: 'auth.info', message: 'User login successful' },
      { routingKey: 'auth.error', message: 'Invalid credentials' },
      { routingKey: 'payment.info', message: 'Payment processed' },
      { routingKey: 'payment.error', message: 'Credit card declined' },
      { routingKey: 'order.info', message: 'Order placed successfully' },
      { routingKey: 'order.warning', message: 'Low stock for item' },
      { routingKey: 'system.error', message: 'Database connection lost' },
      { routingKey: 'system.info', message: 'System backup completed' },
      { routingKey: 'user.info', message: 'Profile updated' },
      { routingKey: 'user.warning', message: 'Suspicious activity detected' },
      { routingKey: 'notification.info', message: 'Email sent' },
      { routingKey: 'notification.error', message: 'SMS gateway failed' },
    ];

    console.log('📤 Sending messages with topic routing keys:\n');

    for (const msg of messages) {
      const fullMessage = {
        timestamp: new Date().toISOString(),
        routingKey: msg.routingKey,
        message: msg.message,
        facility: msg.routingKey.split('.')[0],
        severity: msg.routingKey.split('.')[1],
      };

      const buffer = Buffer.from(JSON.stringify(fullMessage));

      // Publish with topic routing key
      channel.publish(EXCHANGE_NAME, msg.routingKey, buffer);

      console.log(`📡 Sent [${msg.routingKey}]: ${msg.message}`);

      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    console.log('\n✅ All topic messages sent');
    console.log('\n💡 Receiver patterns:');
    console.log('   - "*.error" → all error messages');
    console.log('   - "auth.*" → all auth messages');
    console.log('   - "#" → all messages');
    console.log('   - "payment.#" → all payment messages');
    console.log('   - "*.info" → all info messages');

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

sendTopicMessages();
