import pino from 'pino';
import { AsyncLocalStorage } from 'async_hooks';

export const contextStorage = new AsyncLocalStorage<Map<string, any>>();

// Production-ready logger configuration
const pinoLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
    bindings: (bindings) => ({
      pid: bindings.pid,
      hostname: bindings.hostname,
      service: process.env.SERVICE_NAME || 'unknown-service',
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.0.0'
    })
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      path: req.path,
      parameters: req.params,
      query: req.query,
      headers: {
        'user-agent': req.headers['user-agent'],
        'x-forwarded-for': req.headers['x-forwarded-for']
      }
    }),
    res: (res) => ({
      statusCode: res.statusCode,
      headers: res.getHeaders()
    }),
    err: pino.stdSerializers.err
  },
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  } : undefined
});

// Wrapper that adds context from AsyncLocalStorage
class ContextualLogger {
  private addContext(obj: any = {}) {
    const context = contextStorage.getStore();
    const contextData: any = {};
    
    if (context) {
      // Add all context values
      context.forEach((value, key) => {
        contextData[key] = value;
      });
    }
    
    return { ...contextData, ...obj };
  }

  debug(msg: string, obj?: any) {
    pinoLogger.debug(this.addContext(obj), msg);
  }

  info(msg: string, obj?: any) {
    pinoLogger.info(this.addContext(obj), msg);
  }

  warn(msg: string, obj?: any) {
    pinoLogger.warn(this.addContext(obj), msg);
  }

  error(msg: string, obj?: any) {
    pinoLogger.error(this.addContext(obj), msg);
  }

  fatal(msg: string, obj?: any) {
    pinoLogger.fatal(this.addContext(obj), msg);
  }

  // Special method for timing operations
  time(label: string): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.info(`${label} completed`, { duration_ms: duration });
    };
  }

  // Child logger with additional context
  child(bindings: any) {
    const childPino = pinoLogger.child(bindings);
    const childLogger = new ContextualLogger();
    // Override the internal pino instance
    Object.setPrototypeOf(childLogger, childPino);
    return childLogger;
  }
}

export const logger = new ContextualLogger();
