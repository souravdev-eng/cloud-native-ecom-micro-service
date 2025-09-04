#!/usr/bin/env node

/**
 * Topic Pattern - Receiver
 * Receives messages based on topic pattern matching
 * Usage: node receiver.js <pattern1> <pattern2> ...
 *
 * Pattern examples:
 * - "*.error" → all error messages
 * - "auth.*" → all auth messages
 * - "#" → all messages
 * - "payment.#" → all payment messages
 */

const amqp = require('amqplib');

const RABBITMQ_URL = 'amqp://admin:admin123@localhost:5672';
const EXCHANGE_NAME = 'topic_logs';
const EXCHANGE_TYPE = 'topic';

// Get binding patterns from command line
const patterns = process.argv.slice(2);
if (patterns.length === 0) {
  console.log('Usage: node receiver.js <pattern1> <pattern2> ...');
  console.log('\nExamples:');
  console.log('  node receiver.js "#"              // receive all');
  console.log('  node receiver.js "*.error"        // all errors');
  console.log('  node receiver.js "auth.*"         // all auth messages');
  console.log('  node receiver.js "*.info" "*.error" // all info and error');
  process.exit(1);
}

async function receiveTopicMessages() {
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

    // Create exclusive queue
    const q = await channel.assertQueue('', {
      exclusive: true,
    });

    console.log('🌐 Topic Exchange Receiver\n');
    console.log('================================\n');
    console.log(`Exchange: ${EXCHANGE_NAME} (${EXCHANGE_TYPE})`);
    console.log(`Queue: ${q.queue}`);
    console.log('Patterns:');
    patterns.forEach((pattern) => {
      console.log(`  - "${pattern}"`);
    });
    console.log('\n👂 Waiting for messages. Press CTRL+C to exit\n');

    // Bind queue to exchange for each pattern
    for (const pattern of patterns) {
      await channel.bindQueue(q.queue, EXCHANGE_NAME, pattern);
    }

    // Consume messages
    await channel.consume(
      q.queue,
      (msg) => {
        if (msg !== null) {
          const message = JSON.parse(msg.content.toString());
          const routingKey = msg.fields.routingKey;

          // Color code based on severity
          const severityIcons = {
            error: '🔴',
            warning: '🟡',
            info: '🔵',
          };

          const icon = severityIcons[message.severity] || '⚪';

          console.log(`📨 Received [${routingKey}]:`);
          console.log(`   ${icon} ${message.message}`);
          console.log(`   Facility: ${message.facility}`);
          console.log(`   Severity: ${message.severity}`);
          console.log(`   Time: ${message.timestamp}`);
          console.log(
            `   Matched patterns: ${patterns
              .filter((p) => matchPattern(p, routingKey))
              .join(', ')}\n`
          );
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

// Helper function to check if routing key matches pattern
function matchPattern(pattern, routingKey) {
  // Convert pattern to regex
  let regex = pattern
    .replace(/\./g, '\\.') // Escape dots
    .replace(/\*/g, '[^.]*') // * matches exactly one word
    .replace(/#/g, '.*'); // # matches zero or more words

  regex = '^' + regex + '$';
  return new RegExp(regex).test(routingKey);
}

receiveTopicMessages();
