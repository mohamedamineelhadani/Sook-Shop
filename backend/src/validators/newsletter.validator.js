import { body, param } from 'express-validator';

export const subscribeValidator = [
  body('email').isEmail().normalizeEmail().withMessage('A valid email is required'),
  body('source').optional({ nullable: true }).isString().trim().isLength({ max: 40 }),
];

export const unsubscribeValidator = [
  body('email').isEmail().normalizeEmail().withMessage('A valid email is required'),
];

export const newsletterIdValidator = [
  param('id').isMongoId().withMessage('Invalid subscriber id'),
];
