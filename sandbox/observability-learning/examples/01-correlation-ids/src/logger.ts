import { AsyncLocalStorage } from 'async_hooks';
import pino from 'pino';

// Create a storage for the correlation ID that is scoped to the current execution context
export const storage = new AsyncLocalStorage<Map<string, string>>();

const pinoLogger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname',
      translateTime: 'SYS:standard',
    },
  },
});

export const logger = {
  info: (msg: string, obj?: any) => {
    const context = storage.getStore();
    const correlationId = context?.get('correlationId');
    pinoLogger.info({ correlationId, ...obj }, msg);
  },
  error: (msg: string, obj?: any) => {
    const context = storage.getStore();
    const correlationId = context?.get('correlationId');
    pinoLogger.error({ correlationId, ...obj }, msg);
  },
  warn: (msg: string, obj?: any) => {
    const context = storage.getStore();
    const correlationId = context?.get('correlationId');
    pinoLogger.warn({ correlationId, ...obj }, msg);
  },
};

