import { body } from 'express-validator';

const productId = () =>
  body('productId').isMongoId().withMessage('A valid product id is required');
const quantity = () =>
  body('quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1')
    .toInt();
const options = () => [
  body('color').optional({ nullable: true }).isString().trim(),
  body('size').optional({ nullable: true }).isString().trim(),
];

export const addCartItemValidator = [productId(), quantity(), ...options()];
export const updateCartItemValidator = [productId(), quantity().optional(), ...options()];
export const removeCartItemValidator = [productId(), ...options()];

export const syncCartValidator = [
  body('items').isArray().withMessage('Items must be an array'),
  body('items.*.productId').isMongoId().withMessage('Each item needs a valid product id'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Each item needs a quantity of at least 1')
    .toInt(),
  body('items.*.color').optional({ nullable: true }).isString().trim(),
  body('items.*.size').optional({ nullable: true }).isString().trim(),
];
