import { body } from 'express-validator';

export const signUpValidation = [
  body('name').not().isEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('passwordConform').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Password confirmation does not match password');
    }
    // Indicates the success of this synchronous custom validator
    return true;
  }),
];

export const signInValidation = [
  body('email').isEmail().withMessage('Email is required'),
  body('password').not().isEmpty().withMessage('Password is required'),
];
