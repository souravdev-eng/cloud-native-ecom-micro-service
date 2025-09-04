/**
 * Shared configuration for RabbitMQ examples
 */

const config = {
  // RabbitMQ connection settings
  rabbitmq: {
    host: process.env.RABBITMQ_HOST || 'localhost',
    port: process.env.RABBITMQ_PORT || 5672,
    user: process.env.RABBITMQ_USER || 'admin',
    password: process.env.RABBITMQ_PASSWORD || 'admin123',
    vhost: process.env.RABBITMQ_VHOST || '/',

    // Build connection URL
    get url() {
      return `amqp://${this.user}:${this.password}@${this.host}:${this.port}${this.vhost}`;
    },
  },

  // Management UI settings
  management: {
    port: process.env.RABBITMQ_MANAGEMENT_PORT || 15672,
    get url() {
      return `http://${config.rabbitmq.host}:${this.port}`;
    },
  },

  // Connection options
  connection: {
    heartbeat: parseInt(process.env.RABBITMQ_HEARTBEAT || '60'),
    connectionTimeout: parseInt(process.env.RABBITMQ_CONNECTION_TIMEOUT || '10000'),
  },

  // Queue defaults
  queueDefaults: {
    durable: true,
    arguments: {
      'x-message-ttl': 3600000, // 1 hour TTL
      'x-max-length': 10000, // Max 10000 messages
    },
  },

  // Exchange defaults
  exchangeDefaults: {
    durable: false,
    autoDelete: false,
  },
};

module.exports = config;
