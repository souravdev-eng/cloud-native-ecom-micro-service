import jwt from 'jsonwebtoken';
import { Router, Request, Response, NextFunction } from 'express';
import { signUpValidation } from '../validation/newUserValidation';
import { requestValidation, BadRequestError } from '@ecom-micro/common';

import { User } from '../entity/User';


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
    const existsUser = await User.findOneBy({ email: req.body.email });

    if (existsUser) {
      return next(new BadRequestError('This email is already in use! Please try another'));
    }

    const user = User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConform: req.body.passwordConform,
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
