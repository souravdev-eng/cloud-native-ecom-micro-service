#!/usr/bin/env node

/**
 * RabbitMQ Queue Monitor
 * Displays real-time statistics about queues
 */

const amqp = require('amqplib');
const http = require('http');

const RABBITMQ_URL = 'amqp://admin:admin123@localhost:5672';
const MANAGEMENT_API = 'http://localhost:15672/api';
const AUTH = Buffer.from('admin:admin123').toString('base64');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

async function getQueuesInfo() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 15672,
      path: '/api/queues',
      method: 'GET',
      headers: {
        Authorization: `Basic ${AUTH}`,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const queues = JSON.parse(data);
          resolve(queues);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function getExchangesInfo() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 15672,
      path: '/api/exchanges',
      method: 'GET',
      headers: {
        Authorization: `Basic ${AUTH}`,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const exchanges = JSON.parse(data);
          resolve(exchanges);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

function getStatusColor(messages) {
  if (messages === 0) return colors.green;
  if (messages < 100) return colors.yellow;
  return colors.red;
}

async function displayMonitor() {
  console.clear();
  console.log(`${colors.bright}${colors.cyan}🐰 RabbitMQ Monitor${colors.reset}`);
  console.log('='.repeat(80));
  console.log(`${colors.dim}Refreshing every 2 seconds... Press CTRL+C to exit${colors.reset}\n`);

  try {
    // Get queue information
    const queues = await getQueuesInfo();
    const exchanges = await getExchangesInfo();

    // Display Exchanges
    console.log(`${colors.bright}${colors.blue}📡 EXCHANGES${colors.reset}`);
    console.log('-'.repeat(80));
    console.log(
      `${'Name'.padEnd(30)} ${'Type'.padEnd(15)} ${'Durable'.padEnd(10)} ${'Auto-Delete'}`
    );
    console.log('-'.repeat(80));

    exchanges
      .filter((e) => e.name && !e.name.startsWith('amq.'))
      .forEach((exchange) => {
        console.log(
          `${exchange.name.padEnd(30)} ` +
            `${exchange.type.padEnd(15)} ` +
            `${(exchange.durable ? '✓' : '✗').padEnd(10)} ` +
            `${exchange.auto_delete ? '✓' : '✗'}`
        );
      });

    // Display Queues
    console.log(`\n${colors.bright}${colors.magenta}📦 QUEUES${colors.reset}`);
    console.log('-'.repeat(80));
    console.log(
      `${'Queue Name'.padEnd(25)} ` +
        `${'Messages'.padEnd(12)} ` +
        `${'Ready'.padEnd(10)} ` +
        `${'Unacked'.padEnd(10)} ` +
        `${'Consumers'.padEnd(12)} ` +
        `${'Rate In'.padEnd(10)} ` +
        `${'Rate Out'}`
    );
    console.log('-'.repeat(80));

    if (queues.length === 0) {
      console.log(`${colors.dim}No queues found${colors.reset}`);
    } else {
      queues.forEach((queue) => {
        const statusColor = getStatusColor(queue.messages);
        const rateIn = queue.message_stats?.publish_details?.rate || 0;
        const rateOut = queue.message_stats?.deliver_get_details?.rate || 0;

        console.log(
          `${queue.name.substring(0, 25).padEnd(25)} ` +
            `${statusColor}${formatNumber(queue.messages).padEnd(12)}${colors.reset}` +
            `${formatNumber(queue.messages_ready).padEnd(10)} ` +
            `${formatNumber(queue.messages_unacknowledged).padEnd(10)} ` +
            `${queue.consumers.toString().padEnd(12)} ` +
            `${rateIn.toFixed(1).padEnd(10)} ` +
            `${rateOut.toFixed(1)}`
        );
      });
    }

    // Summary statistics
    const totalMessages = queues.reduce((sum, q) => sum + q.messages, 0);
    const totalConsumers = queues.reduce((sum, q) => sum + q.consumers, 0);

    console.log('\n' + '-'.repeat(80));
    console.log(`${colors.bright}📊 SUMMARY${colors.reset}`);
    console.log(
      `Total Queues: ${queues.length} | Total Messages: ${formatNumber(
        totalMessages
      )} | Total Consumers: ${totalConsumers}`
    );

    // Display timestamp
    console.log(`\n${colors.dim}Last updated: ${new Date().toLocaleTimeString()}${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}❌ Error fetching data: ${error.message}${colors.reset}`);
    console.log(
      `${colors.yellow}Make sure RabbitMQ Management API is accessible at http://localhost:15672${colors.reset}`
    );
  }
}

// Main monitoring loop
async function startMonitoring() {
  // Initial display
  await displayMonitor();

  // Refresh every 2 seconds
  const interval = setInterval(async () => {
    await displayMonitor();
  }, 2000);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    clearInterval(interval);
    console.clear();
    console.log(`\n${colors.bright}${colors.green}✅ Monitoring stopped${colors.reset}\n`);
    process.exit(0);
  });
}

// Check if RabbitMQ is accessible
async function checkConnection() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    await connection.close();
    return true;
  } catch (error) {
    console.error(`${colors.red}❌ Cannot connect to RabbitMQ at ${RABBITMQ_URL}${colors.reset}`);
    console.log(
      `${colors.yellow}Please ensure RabbitMQ is running: npm run start:rabbitmq${colors.reset}`
    );
    return false;
  }
}

// Start the monitor
(async () => {
  console.log(`${colors.bright}${colors.cyan}🚀 Starting RabbitMQ Monitor...${colors.reset}\n`);

  const isConnected = await checkConnection();
  if (isConnected) {
    await startMonitoring();
  } else {
    process.exit(1);
  }
})();
