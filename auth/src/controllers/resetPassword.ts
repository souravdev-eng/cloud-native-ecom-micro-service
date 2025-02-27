import bcrypt from 'bcryptjs';
import { BadRequestError } from '@ecom-micro/common';
import { Router, Request, Response, NextFunction } from 'express';

import { publishDirectMessage } from '../queue/auth.producer';
import { User } from '../models/User';

const router = Router();

router.put(
    '/api/users/reset-password',
    async (req: Request, res: Response, next: NextFunction) => {
        const { email, token, newPassword } = req.body;

        const user = await User.findOne({ email, resetToken: token });

        if (!user) {
            return next(
                new BadRequestError('User not found with this email address!')
            );
        }

        const password = await bcrypt.hash(newPassword, 12);
        user.password = password;

        // @ts-ignore
        user.resetToken = null;
        await user.save();

        const messageDetails = {
            receiverEmail: email,
            emailTopic: 'Password updated successfully',
            emailData: 'Your password updated successfully!',
        };

        await publishDirectMessage(
            JSON.stringify(messageDetails),
            'Password updated successfully'
        );

        return res.status(200).json({ message: 'Password reset successful.' });
    }
);

export { router as resetPasswordRoute };
