#!/usr/bin/env node

/**
 * Idempotency Consumer
 * Demonstrates idempotent message processing using Redis for deduplication
 */

const amqp = require('amqplib');
const redis = require('redis');

// Configuration
const RABBITMQ_URL = 'amqp://admin:admin123@localhost:5672';
const REDIS_URL = 'redis://localhost:6379';
const QUEUE_NAME = 'payment_queue';

// Redis key prefixes
const IDEMPOTENCY_KEY_PREFIX = 'idempotent:payment:';
const PROCESSING_LOCK_PREFIX = 'processing:payment:';

// TTL for idempotency keys (24 hours)
const IDEMPOTENCY_TTL = 24 * 60 * 60; // seconds

class IdempotencyManager {
  constructor(redisClient) {
    this.redis = redisClient;
  }

  /**
   * Check if a message has already been processed
   */
  async isProcessed(idempotencyKey) {
    const key = IDEMPOTENCY_KEY_PREFIX + idempotencyKey;
    const result = await this.redis.get(key);
    return result !== null;
  }

  /**
   * Mark a message as processed
   */
  async markProcessed(idempotencyKey, result) {
    const key = IDEMPOTENCY_KEY_PREFIX + idempotencyKey;
    const value = JSON.stringify({
      processedAt: new Date().toISOString(),
      result: result,
      status: 'completed',
    });
    await this.redis.setEx(key, IDEMPOTENCY_TTL, value);
  }

  /**
   * Get processing result for an already processed message
   */
  async getProcessedResult(idempotencyKey) {
    const key = IDEMPOTENCY_KEY_PREFIX + idempotencyKey;
    const result = await this.redis.get(key);
    return result ? JSON.parse(result) : null;
  }

  /**
   * Acquire processing lock to prevent race conditions
   */
  async acquireProcessingLock(idempotencyKey, ttlSeconds = 300) {
    const lockKey = PROCESSING_LOCK_PREFIX + idempotencyKey;
    const lockValue = `${Date.now()}-${Math.random()}`;

    // Use SET with NX (only if not exists) and EX (expire time)
    const result = await this.redis.set(lockKey, lockValue, {
      NX: true,
      EX: ttlSeconds,
    });

    return result === 'OK' ? lockValue : null;
  }

  /**
   * Release processing lock
   */
  async releaseProcessingLock(idempotencyKey, lockValue) {
    const lockKey = PROCESSING_LOCK_PREFIX + idempotencyKey;

    // Lua script to ensure we only delete our own lock
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    return await this.redis.eval(script, {
      keys: [lockKey],
      arguments: [lockValue],
    });
  }
}

// Simulate payment processing
async function processPayment(payment) {
  console.log(`💳 Processing payment ${payment.id}...`);
  console.log(`   Customer: ${payment.customerId}`);
  console.log(`   Amount: $${payment.amount} ${payment.currency}`);
  console.log(`   Method: ${payment.paymentMethod}`);

  // Simulate processing time
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Simulate processing logic
  const result = {
    paymentId: payment.id,
    transactionId: `TXN-${Date.now()}`,
    status: 'completed',
    amount: payment.amount,
    currency: payment.currency,
    processedAt: new Date().toISOString(),
    customerId: payment.customerId,
  };

  console.log(`   ✅ Payment processed successfully!`);
  console.log(`   Transaction ID: ${result.transactionId}`);

  return result;
}

async function handleMessage(channel, message, idempotencyManager) {
  const content = message.content.toString();
  const payment = JSON.parse(content);
  const idempotencyKey = message.properties.headers['idempotency-key'];
  const messageId = message.properties.messageId || payment.id;

  console.log(`\n📨 Received message: ${messageId}`);
  console.log(
    `   Idempotency Key: ${idempotencyKey ? idempotencyKey.substring(0, 8) + '...' : 'MISSING'}`
  );

  if (!idempotencyKey) {
    console.log(`   ❌ Missing idempotency key - rejecting message`);
    channel.nack(message, false, false); // Reject without requeue
    return;
  }

  try {
    // Step 1: Check if already processed
    const alreadyProcessed = await idempotencyManager.isProcessed(idempotencyKey);

    if (alreadyProcessed) {
      console.log(`   🔄 DUPLICATE DETECTED - Message already processed`);
      const previousResult = await idempotencyManager.getProcessedResult(idempotencyKey);
      console.log(`   📋 Previous result: Transaction ${previousResult.result.transactionId}`);
      console.log(`   📅 Processed at: ${previousResult.processedAt}`);
      console.log(`   ✅ Acknowledging duplicate message (no reprocessing needed)`);

      channel.ack(message);
      return;
    }

    // Step 2: Acquire processing lock to prevent race conditions
    console.log(`   🔒 Acquiring processing lock...`);
    const lockValue = await idempotencyManager.acquireProcessingLock(idempotencyKey);

    if (!lockValue) {
      console.log(`   ⏳ Another instance is processing this message - will retry`);
      // Nack with requeue to try again later
      channel.nack(message, false, true);
      return;
    }

    console.log(`   🔓 Processing lock acquired`);

    try {
      // Step 3: Double-check if processed (race condition protection)
      const doubleCheck = await idempotencyManager.isProcessed(idempotencyKey);
      if (doubleCheck) {
        console.log(`   🔄 Message was processed by another instance during lock acquisition`);
        const previousResult = await idempotencyManager.getProcessedResult(idempotencyKey);
        console.log(`   📋 Previous result: Transaction ${previousResult.result.transactionId}`);
        channel.ack(message);
        return;
      }

      // Step 4: Process the payment
      console.log(`   🚀 Processing payment (first time)...`);
      const result = await processPayment(payment);

      // Step 5: Mark as processed in Redis
      await idempotencyManager.markProcessed(idempotencyKey, result);
      console.log(`   💾 Result stored in Redis with TTL of ${IDEMPOTENCY_TTL}s`);

      // Step 6: Acknowledge the message
      channel.ack(message);
      console.log(`   ✅ Message acknowledged and completed`);
    } finally {
      // Step 7: Always release the processing lock
      await idempotencyManager.releaseProcessingLock(idempotencyKey, lockValue);
      console.log(`   🔓 Processing lock released`);
    }
  } catch (error) {
    console.log(`   ❌ Error processing message: ${error.message}`);

    // For this example, we'll nack and requeue
    // In production, you might want more sophisticated error handling
    channel.nack(message, false, true);
  }
}

async function setupConsumer() {
  let connection;
  let channel;
  let redisClient;

  try {
    // Connect to Redis
    console.log('🔌 Connecting to Redis...');
    redisClient = redis.createClient({ url: REDIS_URL });
    await redisClient.connect();
    console.log('✅ Redis connected');

    // Test Redis connection
    await redisClient.ping();
    console.log('🏓 Redis ping successful');

    // Create idempotency manager
    const idempotencyManager = new IdempotencyManager(redisClient);

    // Connect to RabbitMQ
    console.log('🔌 Connecting to RabbitMQ...');
    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    console.log('📡 RabbitMQ channel created');

    // Set prefetch to process one message at a time
    channel.prefetch(1);
    console.log('⚙️  Prefetch set to 1\n');

    console.log('👂 Starting idempotent consumer...\n');
    console.log('Press CTRL+C to exit\n');
    console.log('=====================================\n');

    // Start consuming messages
    await channel.consume(
      QUEUE_NAME,
      async (message) => {
        if (message !== null) {
          await handleMessage(channel, message, idempotencyManager);
        }
      },
      { noAck: false }
    );

    console.log('🎯 Consumer is running and waiting for messages...\n');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n\n🛑 Shutting down gracefully...');
      try {
        await channel.close();
        await connection.close();
        await redisClient.quit();
        console.log('👋 Connections closed');
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
    if (redisClient) await redisClient.quit();
    process.exit(1);
  }
}

// Display Redis monitoring info
async function displayRedisInfo() {
  try {
    const redisClient = redis.createClient({ url: REDIS_URL });
    await redisClient.connect();

    setInterval(async () => {
      try {
        const keys = await redisClient.keys(IDEMPOTENCY_KEY_PREFIX + '*');
        const lockKeys = await redisClient.keys(PROCESSING_LOCK_PREFIX + '*');

        if (keys.length > 0 || lockKeys.length > 0) {
          console.log(
            `\n📊 Redis Status: ${keys.length} processed messages, ${lockKeys.length} active locks`
          );
        }
      } catch (err) {
        // Ignore monitoring errors
      }
    }, 10000); // Every 10 seconds
  } catch (error) {
    console.log('Redis monitoring not available:', error.message);
  }
}

// Run the consumer
console.log('🚀 Idempotency Consumer Started\n');
console.log('================================\n');
console.log('💡 This consumer demonstrates:');
console.log('   - Redis-based message deduplication');
console.log('   - Idempotency key validation');
console.log('   - Race condition prevention with locks');
console.log('   - Duplicate message handling\n');

// Start Redis monitoring in background
displayRedisInfo();

// Start main consumer
setupConsumer();
