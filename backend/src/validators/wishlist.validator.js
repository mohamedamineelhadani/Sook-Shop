import { body, param } from 'express-validator';

export const productIdValidator = [
  param('productId').isMongoId().withMessage('Invalid product id'),
];

export const syncWishlistValidator = [
  body('productIds').isArray().withMessage('productIds must be an array'),
  body('productIds.*').isMongoId().withMessage('Each id must be a valid product id'),
];
