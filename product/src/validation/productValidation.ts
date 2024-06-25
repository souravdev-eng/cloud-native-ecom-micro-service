import { body } from 'express-validator';

export const productValidation = [
  body('title').not().isEmpty().withMessage('Product must have a title'),
  body('category').not().isEmpty().withMessage('Product must have a category'),
  body('description').not().isEmpty().withMessage('Product must have a description'),
  body('image').not().isEmpty().withMessage('Product must have a image'),
  body('price')
    .isFloat({ min: 100, max: 1000000 })
    .withMessage('Price must be greater than 100 and less than 1000000'),
];
