import { body, param } from 'express-validator';

export const createContactValidator = [
  body('name')
    .isString()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('Name must be between 2 and 80 characters'),
  body('email').isEmail().normalizeEmail().withMessage('A valid email is required'),
  body('subject').optional({ nullable: true }).isString().trim().isLength({ max: 120 }),
  body('message')
    .isString()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Message must be between 10 and 2000 characters'),
];

export const contactIdValidator = [param('id').isMongoId().withMessage('Invalid message id')];

export const readValidator = [
  body('isRead').isBoolean().withMessage('isRead must be true or false').toBoolean(),
];
