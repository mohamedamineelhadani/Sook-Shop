import { body, param } from 'express-validator';

function required(chain) {
  return chain;
}

function optional(chain) {
  chain.optional({ nullable: true });
  return chain;
}

function productFields(isCreate) {
  const field = (chain) => (isCreate ? required(chain) : optional(chain));

  return [
    field(body('name').trim().notEmpty().withMessage('Product name is required')),
    field(body('category').isMongoId().withMessage('A valid category is required')),
    field(
      body('price')
        .isFloat({ min: 0 })
        .withMessage('Price must be a number of 0 or more')
        .toFloat(),
    ),
    body('slug')
      .optional({ nullable: true, checkFalsy: true })
      .trim()
      .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .withMessage('Slug must use lowercase letters, numbers and dashes'),
    body('description').optional({ nullable: true }).trim(),
    body('brand').optional({ nullable: true }).trim(),
    body('sku').optional({ nullable: true, checkFalsy: true }).trim(),
    body('compareAtPrice')
      .optional({ nullable: true, checkFalsy: true })
      .isFloat({ min: 0 })
      .toFloat(),
    body('stock').optional().isInt({ min: 0 }).withMessage('Stock cannot be negative').toInt(),
    body('images').optional().isArray().withMessage('Images must be an array'),
    body('images.*').optional().isString().trim(),
    body('colors').optional().isArray().withMessage('Colors must be an array'),
    body('colors.*').optional().isString().trim(),
    body('sizes').optional().isArray().withMessage('Sizes must be an array'),
    body('sizes.*').optional().isString().trim(),
    body('isFeatured').optional().isBoolean().toBoolean(),
    body('isActive').optional().isBoolean().toBoolean(),
  ];
}

export const createProductValidator = productFields(true);
export const updateProductValidator = productFields(false);

export const productIdValidator = [
  param('id').isMongoId().withMessage('Invalid product id'),
];
