import { Router } from 'express';

import {
  createCategory,
  deleteCategory,
  getCategory,
  listCategories,
  updateCategory,
} from '../controllers/category.controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { authorize, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  categoryIdValidator,
  createCategoryValidator,
  updateCategoryValidator,
} from '../validators/category.validator.js';

const router = Router();
const adminOnly = [protect, authorize('admin')];

router.get('/', asyncHandler(listCategories));
router.get('/:idOrSlug', asyncHandler(getCategory));
router.post('/', ...adminOnly, createCategoryValidator, validate, asyncHandler(createCategory));
router.put(
  '/:id',
  ...adminOnly,
  categoryIdValidator,
  updateCategoryValidator,
  validate,
  asyncHandler(updateCategory),
);
router.delete('/:id', ...adminOnly, categoryIdValidator, validate, asyncHandler(deleteCategory));

export default router;
