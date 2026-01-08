import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { storage } from './logger';

export const correlationIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // 1. Extract from header or generate new one
  const headerName = 'x-correlation-id';
  const correlationId = (req.headers[headerName] as string) || uuidv4();

  // 2. Set it in the response header so the client knows what it was
  res.setHeader(headerName, correlationId);

  // 3. Store it in AsyncLocalStorage so it's available throughout the request
  const store = new Map();
  store.set('correlationId', correlationId);

  storage.run(store, () => {
    next();
  });
};

