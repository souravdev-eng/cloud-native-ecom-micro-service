#!/usr/bin/env node

/**
 * RPC Pattern - Client
 * Makes remote procedure calls to the server
 */

const amqp = require('amqplib');
const { v4: uuidv4 } = require('uuid');

const RABBITMQ_URL = 'amqp://admin:admin123@localhost:5672';
const RPC_QUEUE = 'rpc_queue';

class RPCClient {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.replyQueue = null;
    this.pendingRequests = new Map();
  }

  async connect() {
    this.connection = await amqp.connect(RABBITMQ_URL);
    this.channel = await this.connection.createChannel();

    // Create exclusive reply queue
    const q = await this.channel.assertQueue('', { exclusive: true });
    this.replyQueue = q.queue;

    // Consume replies
    await this.channel.consume(
      this.replyQueue,
      (msg) => {
        if (msg !== null) {
          const correlationId = msg.properties.correlationId;
          const pendingRequest = this.pendingRequests.get(correlationId);

          if (pendingRequest) {
            const response = JSON.parse(msg.content.toString());
            pendingRequest.resolve(response);
            this.pendingRequests.delete(correlationId);
          }
        }
      },
      { noAck: true }
    );

    console.log('✅ RPC Client connected\n');
  }

  async call(functionName, args, timeout = 5000) {
    const correlationId = uuidv4();

    const request = {
      function: functionName,
      args: args,
    };

    // Create promise for response
    const responsePromise = new Promise((resolve, reject) => {
      // Set timeout
      const timer = setTimeout(() => {
        this.pendingRequests.delete(correlationId);
        reject(new Error('RPC request timeout'));
      }, timeout);

      // Store resolver with timer
      this.pendingRequests.set(correlationId, {
        resolve: (response) => {
          clearTimeout(timer);
          resolve(response);
        },
        reject: reject,
      });
    });

    // Send request
    this.channel.sendToQueue(RPC_QUEUE, Buffer.from(JSON.stringify(request)), {
      correlationId: correlationId,
      replyTo: this.replyQueue,
    });

    return responsePromise;
  }

  async close() {
    await this.channel.close();
    await this.connection.close();
  }
}

async function runRPCClient() {
  const client = new RPCClient();

  try {
    await client.connect();

    console.log('🚀 RPC Client Demo\n');
    console.log('================================\n');
    console.log('Making remote procedure calls...\n');

    // Test fibonacci
    console.log('📞 Calling fibonacci(10)...');
    let result = await client.call('fibonacci', 10);
    console.log(`   Result: ${result.result}`);
    console.log(`   Execution time: ${result.executionTime}ms\n`);

    // Test factorial
    console.log('📞 Calling factorial(5)...');
    result = await client.call('factorial', 5);
    console.log(`   Result: ${result.result}`);
    console.log(`   Execution time: ${result.executionTime}ms\n`);

    // Test isPrime
    console.log('📞 Calling isPrime(17)...');
    result = await client.call('isPrime', 17);
    console.log(`   Result: ${result.result}`);
    console.log(`   Execution time: ${result.executionTime}ms\n`);

    // Test sqrt
    console.log('📞 Calling sqrt(144)...');
    result = await client.call('sqrt', 144);
    console.log(`   Result: ${result.result}`);
    console.log(`   Execution time: ${result.executionTime}ms\n`);

    // Test power
    console.log('📞 Calling power({base: 2, exponent: 10})...');
    result = await client.call('power', { base: 2, exponent: 10 });
    console.log(`   Result: ${result.result}`);
    console.log(`   Execution time: ${result.executionTime}ms\n`);

    // Test invalid function
    console.log('📞 Calling invalidFunction()...');
    result = await client.call('invalidFunction', null);
    if (!result.success) {
      console.log(`   ❌ Error: ${result.error}\n`);
    }

    // Test batch calls
    console.log('📞 Making batch calls...');
    const batchPromises = [
      client.call('fibonacci', 15),
      client.call('factorial', 7),
      client.call('isPrime', 23),
      client.call('sqrt', 256),
    ];

    const batchResults = await Promise.all(batchPromises);
    console.log('   Batch results:');
    batchResults.forEach((res, index) => {
      console.log(`     [${index + 1}] Result: ${res.result}, Time: ${res.executionTime}ms`);
    });

    console.log('\n✅ All RPC calls completed successfully!');

    await client.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await client.close();
    process.exit(1);
  }
}

// Add uuid package to dependencies if not present
const fs = require('fs');
const packagePath =
  '/Users/sauravmajumdar/Developer/project/micro-service/cloud-native-ecom-micro-service/sandbox/rabbitmq-learning/package.json';
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
if (!packageJson.dependencies.uuid) {
  packageJson.dependencies.uuid = '^9.0.1';
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
}

runRPCClient();
