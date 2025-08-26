import { winstonLogger } from '@ecom-micro/common';
import { config } from '../config';

export const logger = winstonLogger(
  config.ELASTICSEARCH_URL!,
  'auth-service',
  config.NODE_ENV === 'development' ? 'debug' : 'info'
);
