import { Router, Request, Response, NextFunction } from 'express';
import { requestValidation, BadRequestError } from '@ecom-micro/common';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import { signInValidation } from '../validation/newUserValidation';
import { User } from '../models/User';
import { compareDBPassword } from '../utils/compareDBPassword';
import { logger } from '../utils/logger';

const signInToken = (id: string, email: string, role: string) => {
    return jwt.sign({ id, email, role }, process.env.JWT_KEY!, {
        expiresIn: '90d',
    });
};

const router = Router();

router.post(
    '/api/users/login',
    signInValidation,
    requestValidation,
    async (req: Request, res: Response, next: NextFunction) => {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            /**
             * The logger masks the email to `j***@example.com`. A spike of
             * these warnings is the first sign of credential stuffing.
             */
            logger.warn('Login failed', { reason: 'unknown_email', email });
            return next(
                new BadRequestError(
                    'Invalid email or Password. Please try again!.'
                )
            );
        }

        const passwordMatch = await compareDBPassword(password, user?.password);

        if (!passwordMatch) {
            logger.warn('Login failed', { reason: 'wrong_password', userId: user.id, email });
            return next(
                new BadRequestError(
                    'Invalid email or Password. Please try again.'
                )
            );
        }

        const token = signInToken(user.id, user.email, user.role);
        //* store the token in the session

        req.session = { jwt: token };

        logger.info('User logged in', { userId: user.id, email: user.email, role: user.role });

        res.status(200).send({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
    }
);

export { router as loginUser };
