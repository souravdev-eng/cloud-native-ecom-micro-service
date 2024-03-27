import { QueueConnection } from '@ecom-micro/common'
import { config } from '../config';

const queueConnection = new QueueConnection(config.RABBITMQ_ENDPOINT!);

export { queueConnection };