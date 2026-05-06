import { BadRequestError } from '@ecom-micro/common';
import { body } from 'express-validator';

const validCategories = ['phone', 'earphone', 'book', 'fashions', 'other'];

export const productValidation = [
  body('title').not().isEmpty().withMessage('Product must have a title'),
  body('category').not().isEmpty().withMessage('Product must have a category'),
  body('description').not().isEmpty().withMessage('Product must have a description'),
  body('image').not().isEmpty().withMessage('Product must have a image'),
  body('originalPrice')
    .isFloat({ min: 10, max: 5000000 })
    .withMessage('Original price must be greater than 10 and less than 5000000'),
  body('price').custom((value: number, { req }) => {
    if (req.body.originalPrice <= value) {
      throw new BadRequestError('Price must be greater than or equal to original price');
    }
    return true;
  }),
];

export const productUpdateValidation = [
  body('price')
    .optional()
    .isFloat({ min: 10, max: 5000000 })
    .withMessage('Price must be greater than 100 and less than 5000000'),
  body('category')
    .optional()
    .isIn(validCategories)
    .withMessage(`Category must be one of: ${validCategories.join(', ')}`),
];
