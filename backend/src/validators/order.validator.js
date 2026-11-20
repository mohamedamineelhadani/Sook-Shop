import { body, param } from 'express-validator';

import { ORDER_STATUSES } from '../models/Order.js';

export const orderIdValidator = [
  param('id').isMongoId().withMessage('Invalid order id'),
];

export const createOrderValidator = [
  body('shippingAddress.fullName')
    .isString()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Enter the recipient full name'),
  body('shippingAddress.phone')
    .isString()
    .trim()
    .matches(/^[0-9+\-()\s]{6,20}$/)
    .withMessage('Enter a valid phone number'),
  body('shippingAddress.line1')
    .isString()
    .trim()
    .isLength({ min: 3 })
    .withMessage('Enter the street address'),
  body('shippingAddress.line2').optional({ nullable: true }).isString().trim(),
  body('shippingAddress.city')
    .isString()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Enter the city'),
  body('shippingAddress.postalCode').optional({ nullable: true }).isString().trim(),
  body('shippingAddress.country').optional({ nullable: true }).isString().trim(),
  body('notes').optional({ nullable: true }).isString().trim().isLength({ max: 500 }),
  body('saveAddress').optional().isBoolean().toBoolean(),
];

export const updateOrderStatusValidator = [
  body('status')
    .isIn(ORDER_STATUSES)
    .withMessage(`Status must be one of: ${ORDER_STATUSES.join(', ')}`),
];
