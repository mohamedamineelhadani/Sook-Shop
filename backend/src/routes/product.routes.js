import { Router } from 'express';

import {
  createProduct,
  deleteProduct,
  getProduct,
  listBrands,
  listProducts,
  suggestProducts,
  updateProduct,
} from '../controllers/product.controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { authorize, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createProductValidator,
  productIdValidator,
  updateProductValidator,
} from '../validators/product.validator.js';

const router = Router();
const adminOnly = [protect, authorize('admin')];

router.get('/', asyncHandler(listProducts));
router.get('/brands', asyncHandler(listBrands));
router.get('/suggest', asyncHandler(suggestProducts));
router.get('/:slug', asyncHandler(getProduct));
router.post('/', ...adminOnly, createProductValidator, validate, asyncHandler(createProduct));
router.put(
  '/:id',
  ...adminOnly,
  productIdValidator,
  updateProductValidator,
  validate,
  asyncHandler(updateProduct),
);
router.delete('/:id', ...adminOnly, productIdValidator, validate, asyncHandler(deleteProduct));

export default router;
