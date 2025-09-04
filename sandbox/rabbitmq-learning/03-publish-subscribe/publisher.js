#!/usr/bin/env node

/**
 * Publish/Subscribe Pattern - Publisher
 * Uses FANOUT exchange to broadcast messages to all subscribers
 */

const amqp = require('amqplib');

const RABBITMQ_URL = 'amqp://admin:admin123@localhost:5672';
const EXCHANGE_NAME = 'logs_fanout';
const EXCHANGE_TYPE = 'fanout';

async function publishLogs() {
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

    console.log('📢 Fanout Publisher (Broadcast)\n');
    console.log('================================\n');
    console.log(`Exchange: ${EXCHANGE_NAME} (${EXCHANGE_TYPE})\n`);

    // Generate log messages
    const logLevels = ['INFO', 'WARNING', 'ERROR', 'DEBUG'];
    const services = ['auth-service', 'payment-service', 'user-service', 'order-service'];

    console.log('📤 Broadcasting log messages:\n');

    for (let i = 1; i <= 10; i++) {
      const level = logLevels[Math.floor(Math.random() * logLevels.length)];
      const service = services[Math.floor(Math.random() * services.length)];

      const logMessage = {
        id: i,
        timestamp: new Date().toISOString(),
        level: level,
        service: service,
        message: `Log message ${i} from ${service}`,
        details: `This is a ${level.toLowerCase()} message that will be broadcast to all subscribers`,
      };

      const message = Buffer.from(JSON.stringify(logMessage));

      // Publish to exchange (empty routing key for fanout)
      channel.publish(EXCHANGE_NAME, '', message);

      console.log(`📡 Broadcast: [${level}] ${service} - ${logMessage.message}`);

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log('\n✅ All messages broadcast to all subscribers');
    console.log('💡 Start multiple subscribers to see them all receive the same messages');

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

publishLogs();
