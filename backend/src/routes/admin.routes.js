import { Router } from 'express';

import { getCartInsights } from '../controllers/admin.controller.js';
import {
  getOrderStats,
  listAllOrders,
  updateOrderStatus,
} from '../controllers/order.controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { authorize, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  orderIdValidator,
  updateOrderStatusValidator,
} from '../validators/order.validator.js';

const router = Router();

router.use(protect, authorize('admin'));

router.get('/insights', asyncHandler(getCartInsights));
router.get('/order-stats', asyncHandler(getOrderStats));
router.get('/orders', asyncHandler(listAllOrders));
router.patch(
  '/orders/:id/status',
  orderIdValidator,
  updateOrderStatusValidator,
  validate,
  asyncHandler(updateOrderStatus),
);

export default router;
