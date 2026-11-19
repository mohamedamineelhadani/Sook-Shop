import { Router } from 'express';

import {
  createProduct,
  deleteProduct,
  getProduct,
  listBrands,
  listProducts,
  updateProduct,
} from '../controllers/product.controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import {
  createProductValidator,
  productIdValidator,
  updateProductValidator,
} from '../validators/product.validator.js';

const router = Router();

// Write routes will be protected by admin auth in Step 3.
router.get('/', asyncHandler(listProducts));
router.get('/brands', asyncHandler(listBrands));
router.get('/:slug', asyncHandler(getProduct));
router.post('/', createProductValidator, validate, asyncHandler(createProduct));
router.put(
  '/:id',
  productIdValidator,
  updateProductValidator,
  validate,
  asyncHandler(updateProduct),
);
router.delete('/:id', productIdValidator, validate, asyncHandler(deleteProduct));

export default router;
