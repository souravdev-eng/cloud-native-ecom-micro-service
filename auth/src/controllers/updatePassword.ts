import bcrypt from 'bcryptjs';
import { Router, Request, Response, NextFunction } from 'express';
import { BadRequestError, requireAuth } from '@ecom-micro/common';
import { User } from '../models/User';
import { compareDBPassword } from '../utils/compareDBPassword';

const router = Router();

router.put(
    '/api/users/update-password',
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
        const { password, newPassword } = req.body;
        const { email } = req.user;
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return next(
                new BadRequestError('User not found with this email address!')
            );
        }

        const isPasswordMatch = await compareDBPassword(
            password,
            user.password
        );
        if (!isPasswordMatch) {
            return next(new BadRequestError('Oops! Password not matched!'));
        }
        console.log({ password, newPassword });
        console.log('OLD--->', user.password);
        user.password = await bcrypt.hash(newPassword, 12);
        console.log('NEW--->', user);
        // await user.save();

        return res
            .status(200)
            .json({ message: 'Password updated successfully!' });
    }
);

export { router as updatePasswordRoute };
