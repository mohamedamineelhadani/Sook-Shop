import { body, param } from 'express-validator';

import { ADMIN_NOTIFICATION_IDS } from '../constants/notifications.js';

export const adminUserIdValidator = [
  param('id').isMongoId().withMessage('Invalid user id'),
];

export const notificationIdValidator = [
  param('id').isIn(ADMIN_NOTIFICATION_IDS).withMessage('Invalid notification id'),
];

export const customerActiveValidator = [
  body('isActive').isBoolean().withMessage('isActive must be true or false').toBoolean(),
];

export const updateAdminProfileValidator = [
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
  body('phone').optional({ nullable: true }).isString().trim().isLength({ max: 30 }),
];

export const changeAdminPasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isString()
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) throw new Error('Passwords do not match');
    return true;
  }),
];
