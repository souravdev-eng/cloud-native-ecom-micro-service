/**
 * RabbitMQ connection helper with retry logic
 */

const amqp = require('amqplib');

class RabbitMQConnection {
  constructor(url, options = {}) {
    this.url = url;
    this.options = {
      maxRetries: options.maxRetries || 5,
      retryDelay: options.retryDelay || 2000,
      heartbeat: options.heartbeat || 60,
      ...options,
    };
    this.connection = null;
    this.channel = null;
  }

  async connect() {
    let retries = 0;

    while (retries < this.options.maxRetries) {
      try {
        console.log(
          `🔌 Attempting to connect to RabbitMQ... (Attempt ${retries + 1}/${
            this.options.maxRetries
          })`
        );

        this.connection = await amqp.connect(this.url, {
          heartbeat: this.options.heartbeat,
        });

        this.channel = await this.connection.createChannel();

        // Handle connection events
        this.connection.on('error', (err) => {
          console.error('❌ Connection error:', err.message);
        });

        this.connection.on('close', () => {
          console.log('🔌 Connection closed');
        });

        console.log('✅ Successfully connected to RabbitMQ');
        return { connection: this.connection, channel: this.channel };
      } catch (error) {
        retries++;
        console.error(`❌ Connection attempt ${retries} failed:`, error.message);

        if (retries >= this.options.maxRetries) {
          throw new Error(`Failed to connect after ${this.options.maxRetries} attempts`);
        }

        console.log(`⏳ Retrying in ${this.options.retryDelay / 1000} seconds...`);
        await this.delay(this.options.retryDelay);
      }
    }
  }

  async close() {
    try {
      if (this.channel) {
        await this.channel.close();
        console.log('📡 Channel closed');
      }

      if (this.connection) {
        await this.connection.close();
        console.log('🔌 Connection closed');
      }
    } catch (error) {
      console.error('Error closing connection:', error.message);
    }
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Helper method to assert queue with defaults
  async assertQueue(queueName, options = {}) {
    const defaultOptions = {
      durable: true,
      arguments: {
        'x-message-ttl': 3600000, // 1 hour
        'x-max-length': 10000,
      },
    };

    return await this.channel.assertQueue(queueName, {
      ...defaultOptions,
      ...options,
    });
  }

  // Helper method to assert exchange with defaults
  async assertExchange(exchangeName, type, options = {}) {
    const defaultOptions = {
      durable: false,
      autoDelete: false,
    };

    return await this.channel.assertExchange(exchangeName, type, {
      ...defaultOptions,
      ...options,
    });
  }

  // Helper to publish with confirmation
  async publishWithConfirm(exchange, routingKey, content, options = {}) {
    try {
      await this.channel.assertExchange(exchange, 'direct', { durable: true });

      const message = Buffer.isBuffer(content) ? content : Buffer.from(JSON.stringify(content));

      const published = this.channel.publish(exchange, routingKey, message, {
        persistent: true,
        ...options,
      });

      if (published) {
        console.log(`✅ Message published to ${exchange}/${routingKey}`);
      } else {
        console.log(`⚠️ Message queued for ${exchange}/${routingKey}`);
      }

      return published;
    } catch (error) {
      console.error('❌ Publish error:', error.message);
      throw error;
    }
  }

  // Helper to consume with error handling
  async consumeWithErrorHandling(queue, handler, options = {}) {
    const defaultOptions = {
      noAck: false,
    };

    return await this.channel.consume(
      queue,
      async (msg) => {
        if (msg !== null) {
          try {
            await handler(msg, this.channel);

            if (!options.noAck) {
              this.channel.ack(msg);
            }
          } catch (error) {
            console.error('❌ Message processing error:', error.message);

            // Reject and requeue on error (unless noAck is true)
            if (!options.noAck) {
              this.channel.nack(msg, false, true);
            }
          }
        }
      },
      {
        ...defaultOptions,
        ...options,
      }
    );
  }
}

// Factory function for easy connection creation
async function createConnection(url, options = {}) {
  const conn = new RabbitMQConnection(url, options);
  await conn.connect();
  return conn;
}

module.exports = {
  RabbitMQConnection,
  createConnection,
};
