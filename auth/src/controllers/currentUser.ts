import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '@ecom-micro/common';

const router = Router();

router.get(
  '/api/users/currentuser',
  requireAuth,
  (req: Request, res: Response, next: NextFunction) => {
    res.send({ currentUser: req.user });
  }
);

export { router as currentUserRoute };
