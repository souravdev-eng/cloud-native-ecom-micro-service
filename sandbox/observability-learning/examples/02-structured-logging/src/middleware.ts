import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { contextStorage, logger } from './logger';

// Enhanced middleware with request/response logging
export const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const correlationId = (req.headers['x-correlation-id'] as string) || uuidv4();
  const requestId = uuidv4();
  const startTime = Date.now();

  // Set up context for this request
  const store = new Map();
  store.set('correlationId', correlationId);
  store.set('requestId', requestId);
  store.set('method', req.method);
  store.set('path', req.path);
  
  // Add user context if available (would come from auth middleware)
  if ((req as any).user) {
    store.set('userId', (req as any).user.id);
    store.set('userEmail', (req as any).user.email);
  }

  // Set response headers
  res.setHeader('x-correlation-id', correlationId);
  res.setHeader('x-request-id', requestId);

  // Log incoming request
  logger.info('Request received', {
    event: 'http.request.start',
    req,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  // Capture response
  const originalSend = res.send;
  res.send = function(data) {
    res.send = originalSend;
    const responseTime = Date.now() - startTime;
    
    // Log response
    logger.info('Request completed', {
      event: 'http.request.end',
      res,
      responseTime_ms: responseTime,
      responseSize: data ? data.length : 0
    });

    // Log slow requests as warnings
    if (responseTime > 1000) {
      logger.warn('Slow request detected', {
        event: 'performance.slow_request',
        responseTime_ms: responseTime,
        threshold_ms: 1000
      });
    }

    return res.send(data);
  };

  // Handle errors
  res.on('finish', () => {
    if (res.statusCode >= 400) {
      logger.error('Request failed', {
        event: 'http.request.error',
        statusCode: res.statusCode,
        responseTime_ms: Date.now() - startTime
      });
    }
  });

  contextStorage.run(store, () => {
    next();
  });
};

// Error handling middleware
export const errorLoggingMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Unhandled error', {
    event: 'application.error',
    error: err.message,
    stack: err.stack,
    req
  });

  res.status(500).json({
    error: 'Internal server error',
    correlationId: res.getHeader('x-correlation-id')
  });
};
