import bcrypt from 'bcryptjs';
import { Router, Request, Response, NextFunction } from 'express';
import { BadRequestError } from '@ecom-micro/common';
import { User } from '../entity/User';

const router = Router();

router.put(
    '/api/users/reset-password',
    async (req: Request, res: Response, next: NextFunction) => {
        const { email, token, newPassword } = req.body;

        const user = await User.findOneBy({ email, resetToken: token });

        if (!user) {
            return next(new BadRequestError('User not found with this email address!'));
        }

        const password = await bcrypt.hash(newPassword, 12)
        user.password = password;

        // @ts-ignore
        user.resetToken = null;
        await User.save(user);

        return res.status(200).json({ message: 'Password reset successful.' });
    }
);

export { router as updatePasswordRoute };
