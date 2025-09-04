#!/usr/bin/env node

/**
 * RPC Pattern - Server
 * Provides remote procedure call service
 */

const amqp = require('amqplib');

const RABBITMQ_URL = 'amqp://admin:admin123@localhost:5672';
const RPC_QUEUE = 'rpc_queue';

// Simulated functions that can be called remotely
const rpcFunctions = {
  // Calculate fibonacci
  fibonacci: (n) => {
    if (n <= 1) return n;
    let a = 0,
      b = 1;
    for (let i = 2; i <= n; i++) {
      [a, b] = [b, a + b];
    }
    return b;
  },

  // Calculate factorial
  factorial: (n) => {
    if (n <= 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  },

  // Check if prime
  isPrime: (n) => {
    if (n <= 1) return false;
    if (n <= 3) return true;
    if (n % 2 === 0 || n % 3 === 0) return false;
    for (let i = 5; i * i <= n; i += 6) {
      if (n % i === 0 || n % (i + 2) === 0) return false;
    }
    return true;
  },

  // Calculate square root
  sqrt: (n) => {
    return Math.sqrt(n);
  },

  // Power calculation
  power: (args) => {
    return Math.pow(args.base, args.exponent);
  },
};

async function startRPCServer() {
  let connection;
  let channel;

  try {
    // Connect to RabbitMQ
    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();

    // Declare RPC queue
    await channel.assertQueue(RPC_QUEUE, {
      durable: false,
    });

    // Fair dispatch
    channel.prefetch(1);

    console.log('🖥️  RPC Server Started\n');
    console.log('================================\n');
    console.log('Available functions:');
    console.log('  - fibonacci(n)');
    console.log('  - factorial(n)');
    console.log('  - isPrime(n)');
    console.log('  - sqrt(n)');
    console.log('  - power({base, exponent})\n');
    console.log('⏳ Waiting for RPC requests. Press CTRL+C to exit\n');

    // Consume RPC requests
    await channel.consume(RPC_QUEUE, async (msg) => {
      if (msg !== null) {
        const request = JSON.parse(msg.content.toString());
        console.log(`📥 RPC Request received:`);
        console.log(`   Function: ${request.function}`);
        console.log(`   Arguments: ${JSON.stringify(request.args)}`);
        console.log(`   CorrelationId: ${msg.properties.correlationId}`);

        let response = {
          success: false,
          result: null,
          error: null,
        };

        try {
          // Check if function exists
          if (rpcFunctions[request.function]) {
            // Execute function
            const startTime = Date.now();
            response.result = rpcFunctions[request.function](request.args);
            const executionTime = Date.now() - startTime;

            response.success = true;
            response.executionTime = executionTime;

            console.log(`   ✅ Result: ${response.result}`);
            console.log(`   ⏱️  Execution time: ${executionTime}ms`);
          } else {
            response.error = `Function '${request.function}' not found`;
            console.log(`   ❌ Error: ${response.error}`);
          }
        } catch (error) {
          response.error = error.message;
          console.log(`   ❌ Error: ${error.message}`);
        }

        // Send response back to client
        channel.sendToQueue(msg.properties.replyTo, Buffer.from(JSON.stringify(response)), {
          correlationId: msg.properties.correlationId,
        });

        // Acknowledge the message
        channel.ack(msg);
        console.log(`   📤 Response sent\n`);
      }
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 RPC Server shutting down...');
      await channel.close();
      await connection.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

startRPCServer();
