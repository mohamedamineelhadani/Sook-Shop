import { body, param } from 'express-validator';

function categoryFields(required) {
  const name = body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .bail()
    .isLength({ max: 80 })
    .withMessage('Category name must be 80 characters or fewer');
  if (!required) name.optional({ nullable: true });

  return [
    name,
    body('slug')
      .optional({ nullable: true, checkFalsy: true })
      .trim()
      .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .withMessage('Slug must use lowercase letters, numbers and dashes'),
    body('description').optional({ nullable: true }).trim().isLength({ max: 500 }),
    body('image').optional({ nullable: true }).trim(),
    body('parent')
      .optional({ nullable: true, checkFalsy: true })
      .isMongoId()
      .withMessage('Parent must be a valid category id'),
    body('isActive').optional().isBoolean().toBoolean(),
  ];
}

export const createCategoryValidator = categoryFields(true);
export const updateCategoryValidator = categoryFields(false);

export const categoryIdValidator = [
  param('id').isMongoId().withMessage('Invalid category id'),
];
