import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, restrictTo } from '@ecom-micro/common';
import { User } from '../models/User';

const router = Router();

router.get(
    '/api/users',
    requireAuth,
    restrictTo('admin', 'seller'),
    async (req: Request, res: Response, next: NextFunction) => {
        const user = await User.find({});
        res.send(user);
    }
);

export { router as showAllUserRoute };
