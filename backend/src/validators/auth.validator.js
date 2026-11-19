import { body } from 'express-validator';

export const registerValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .bail()
    .isLength({ max: 80 })
    .withMessage('Name must be 80 characters or fewer'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .bail()
    .isEmail()
    .withMessage('Enter a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .bail()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

export const loginValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .bail()
    .isEmail()
    .withMessage('Enter a valid email address')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];
