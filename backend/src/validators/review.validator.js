import { body, param } from 'express-validator';

export const reviewIdValidator = [
  param('id').isMongoId().withMessage('Invalid review id'),
];

const rating = () =>
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be a whole number from 1 to 5')
    .toInt();

const title = () => body('title').optional({ nullable: true }).isString().trim().isLength({ max: 120 });
const text = () =>
  body('body')
    .isString()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Write at least 10 characters (maximum 1000)');

export const createReviewValidator = [
  body('productId').isMongoId().withMessage('A valid product id is required'),
  rating(),
  title(),
  text(),
];

export const updateReviewValidator = [rating(), title(), text()];

export const visibilityValidator = [
  body('isVisible').isBoolean().withMessage('isVisible must be true or false').toBoolean(),
];
