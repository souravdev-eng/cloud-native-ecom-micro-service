import { body } from 'express-validator';

export const orderValidation = [
  body('cartIds')
    .isArray({ min: 1 })
    .withMessage('At least one cart item is required')
    .custom((cartIds) => {
      if (!cartIds.every((id: any) => typeof id === 'string' && id.length > 0)) {
        throw new Error('All cart IDs must be valid strings');
      }
      return true;
    }),

  body('shippingAddress.fullName')
    .notEmpty()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name is required and must be between 2-100 characters'),

  body('shippingAddress.addressLine1')
    .notEmpty()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address line 1 is required and must be between 5-200 characters'),

  body('shippingAddress.addressLine2')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Address line 2 must be less than 200 characters'),

  body('shippingAddress.city')
    .notEmpty()
    .isLength({ min: 2, max: 50 })
    .withMessage('City is required and must be between 2-50 characters'),

  body('shippingAddress.state')
    .notEmpty()
    .isLength({ min: 2, max: 50 })
    .withMessage('State is required and must be between 2-50 characters'),

  body('shippingAddress.postalCode')
    .notEmpty()
    .isLength({ min: 3, max: 20 })
    .withMessage('Postal code is required and must be between 3-20 characters'),

  body('shippingAddress.country')
    .notEmpty()
    .isLength({ min: 2, max: 50 })
    .withMessage('Country is required and must be between 2-50 characters'),

  body('shippingAddress.phoneNumber')
    .optional()
    .isMobilePhone('any')
    .withMessage('Phone number must be valid'),

  body('paymentMethod')
    .notEmpty()
    .isIn(['credit_card', 'debit_card', 'paypal', 'stripe', 'razorpay', 'cash_on_delivery'])
    .withMessage('Payment method is required and must be a valid option'),

  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters'),
];
