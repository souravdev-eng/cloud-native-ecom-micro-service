import { NextFunction, Request, Response } from 'express';
import { NotAuthorizedError } from '../errors/notAuthorized';

export const restrictTo = (...roles: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      return next(new NotAuthorizedError());
    }
    next();
  };
};
