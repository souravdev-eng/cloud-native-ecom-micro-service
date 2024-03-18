import { body } from 'express-validator';

export const cartValidation = [
  body('productId').not().isEmpty().withMessage('Cart must have a productId'),
];
