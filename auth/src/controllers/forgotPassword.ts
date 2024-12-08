import { Router, Request, Response, NextFunction } from 'express';
import { BadRequestError } from '@ecom-micro/common';
import { generateResetToken } from '../service/sendEmail';
import { User } from '../models/User';
import { publishDirectMessage } from '../queue/auth.producer';

const router = Router();

router.post(
    '/api/users/forgot-password',
    async (req: Request, res: Response, next: NextFunction) => {
        const { email } = req.body;

        const resetToken = generateResetToken();

        const user = await User.findOne({ email });

        if (!user) {
            return next(
                new BadRequestError('User not found with this email address!')
            );
        }

        // Save reset token to user in the database
        user.resetToken = resetToken;
        await user.save();

        const forgotPasswordLink = `http://ecom.dev/auth/reset-password?token=${resetToken}&email=${email}`;
        const messageDetails = {
            receiverEmail: email,
            emailTopic: 'Password Reset',
            emailData: forgotPasswordLink,
        };

        await publishDirectMessage(
            JSON.stringify(messageDetails),
            'Password reset'
        );

        res.status(200).send({ message: 'Email sent' });
    }
);

export { router as forgotPasswordRoute };
