import { Router, Request, Response, NextFunction } from 'express';
import { requestValidation, BadRequestError } from '@ecom-micro/common';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import { signInValidation } from '../validation/newUserValidation';
import { User } from '../models/User';

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

        const user = await User.findOne({ email });

        if (!user) {
            return next(
                new BadRequestError(
                    'Invalid email or Password. Please try again!.'
                )
            );
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return next(
                new BadRequestError(
                    'Invalid email or Password. Please try again.'
                )
            );
        }

        const token = signInToken(user.id, user.email, user.role);
        //* store the token in the session

        req.session = { jwt: token };

        res.status(200).send({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
    }
);

export { router as loginUser };
