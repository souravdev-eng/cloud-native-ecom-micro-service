import jwt from 'jsonwebtoken';
import { Router, Request, Response, NextFunction } from 'express';
import { requestValidation, BadRequestError } from '@ecom-micro/common';

import { signUpValidation } from '../validation/newUserValidation';
import { User } from '../models/User';

const signInToken = (id: string, email: string, role: string) => {
    return jwt.sign({ id, email, role }, process.env.JWT_KEY!, {
        expiresIn: '90d',
    });
};

const router = Router();

router.post(
    '/api/users/signup',
    signUpValidation,
    requestValidation,
    async (req: Request, res: Response, next: NextFunction) => {
        const existsUser = await User.findOne({ email: req.body.email });

        if (existsUser) {
            return next(
                new BadRequestError(
                    'This email is already in use! Please try another'
                )
            );
        }

        if (req?.body?.password !== req?.body?.passwordConform) {
            return next(
                new BadRequestError('Password must be same! Please try another')
            );
        }

        const user = User.build({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            role: req.body.role,
        });

        await user.save();

        const token = signInToken(user.id, user.email, user.role);
        // store the token in the session
        req.session = {
            jwt: token,
        };

        res.status(201).send({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
    }
);

export { router as newUser };
