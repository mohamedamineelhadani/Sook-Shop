import { Router } from 'express';

import {
  createOrder,
  getOrder,
  getShippingConfig,
  listMyOrders,
} from '../controllers/order.controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createOrderValidator,
  orderIdValidator,
} from '../validators/order.validator.js';

const router = Router();

// Public: the storefront uses this to show the same shipping rule the API charges.
router.get('/shipping', asyncHandler(getShippingConfig));

router.use(protect);

router.get('/', asyncHandler(listMyOrders));
router.post('/', createOrderValidator, validate, asyncHandler(createOrder));
router.get('/:id', orderIdValidator, validate, asyncHandler(getOrder));

export default router;
