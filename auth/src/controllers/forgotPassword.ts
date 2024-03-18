import { Router, Request, Response, NextFunction } from 'express';
import { BadRequestError } from '@ecom-micro/common';
import { generateResetToken, sendResetTokenEmail } from '../service/sendEmail';
import { User } from '../entity/User';

const router = Router();

router.post(
    '/api/users/forgot-password',
    async (req: Request, res: Response, next: NextFunction) => {
        const { email } = req.body;

        const resetToken = generateResetToken();

        const user = await User.findOneBy({ email });
        if (!user) {
            return next(new BadRequestError('User not found with this email address!'));
        }
        // Save reset token to user in the database
        user.resetToken = resetToken;
        await User.save(user);

        await sendResetTokenEmail(email, resetToken);
        res.status(200).send({ message: "Email sent" })
    }
);

export { router as forgotPasswordRoute };
