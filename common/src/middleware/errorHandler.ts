import { NextFunction, Request, Response } from 'express';
import { BaseError } from '../errors/baseError';

export const errorHandler = async (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(err);
  }
  if (err instanceof BaseError) {
    return res.status(err.statusCode).json({ errors: err.serializeErrors() });
  }

  res.status(500).json({ errors: [{ message: 'something went wrong' }] });
};
