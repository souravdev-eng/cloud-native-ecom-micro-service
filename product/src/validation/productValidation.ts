import { body } from 'express-validator';

const validCategories = ['phone', 'earphone', 'book', 'fashions', 'other'];

export const productValidation = [
  body('title').not().isEmpty().withMessage('Product must have a title'),
  body('category').not().isEmpty().withMessage('Product must have a category'),
  body('description').not().isEmpty().withMessage('Product must have a description'),
  body('image').not().isEmpty().withMessage('Product must have a image'),
  body('price')
    .isFloat({ min: 100, max: 1000000 })
    .withMessage('Price must be greater than 100 and less than 1000000'),
];

export const productUpdateValidation = [
  body('price')
    .optional()
    .isFloat({ min: 100, max: 1000000 })
    .withMessage('Price must be greater than 100 and less than 1000000'),
  body('category')
    .optional()
    .isIn(validCategories)
    .withMessage(`Category must be one of: ${validCategories.join(', ')}`),
];
