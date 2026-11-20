import { Router } from 'express';

import {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  syncWishlist,
} from '../controllers/wishlist.controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  productIdValidator,
  syncWishlistValidator,
} from '../validators/wishlist.validator.js';

const router = Router();

router.use(protect);

router.get('/', asyncHandler(getWishlist));
router.post('/sync', syncWishlistValidator, validate, asyncHandler(syncWishlist));
router.post('/:productId', productIdValidator, validate, asyncHandler(addToWishlist));
router.delete('/:productId', productIdValidator, validate, asyncHandler(removeFromWishlist));

export default router;
