import { Router } from 'express';

import {
  createCategory,
  deleteCategory,
  getCategory,
  listCategories,
  updateCategory,
} from '../controllers/category.controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import {
  categoryIdValidator,
  createCategoryValidator,
  updateCategoryValidator,
} from '../validators/category.validator.js';

const router = Router();

// Write routes will be protected by admin auth in Step 3.
router.get('/', asyncHandler(listCategories));
router.get('/:idOrSlug', asyncHandler(getCategory));
router.post('/', createCategoryValidator, validate, asyncHandler(createCategory));
router.put(
  '/:id',
  categoryIdValidator,
  updateCategoryValidator,
  validate,
  asyncHandler(updateCategory),
);
router.delete('/:id', categoryIdValidator, validate, asyncHandler(deleteCategory));

export default router;
