import { Logger } from 'winston';
import { createLogger } from '../observability/logger';

/**
 * @deprecated Use `createLogger({ service })`. This delegates to it and
 * ignores `elasticSearchNode`, since logs no longer go to Elasticsearch (ADR 0001).
 *
 * `LOG_LEVEL` wins over `level` because callers hardcode the argument.
 */
export const winstonLogger = (_elasticSearchNode: string, name: string, level: string): Logger =>
  createLogger({ service: name, level: process.env.LOG_LEVEL || level });
