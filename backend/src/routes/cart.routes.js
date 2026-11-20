import { Router } from 'express';

import {
  addCartItem,
  clearCart,
  getCart,
  removeCartItem,
  syncCart,
  updateCartItem,
} from '../controllers/cart.controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  addCartItemValidator,
  removeCartItemValidator,
  syncCartValidator,
  updateCartItemValidator,
} from '../validators/cart.validator.js';

const router = Router();

router.use(protect);

router.get('/', asyncHandler(getCart));
router.post('/items', addCartItemValidator, validate, asyncHandler(addCartItem));
router.patch('/items', updateCartItemValidator, validate, asyncHandler(updateCartItem));
router.delete('/items', removeCartItemValidator, validate, asyncHandler(removeCartItem));
router.post('/sync', syncCartValidator, validate, asyncHandler(syncCart));
router.delete('/', asyncHandler(clearCart));

export default router;
