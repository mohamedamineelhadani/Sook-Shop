import { Router } from 'express';

import { getCartInsights, getDashboard } from '../controllers/admin.controller.js';
import {
  deleteContactMessage,
  listContactMessages,
  setContactMessageRead,
} from '../controllers/contact.controller.js';
import {
  deleteNewsletterSubscriber,
  listNewsletterSubscribers,
} from '../controllers/newsletter.controller.js';
import {
  getOrderStats,
  listAllOrders,
  updateOrderStatus,
} from '../controllers/order.controller.js';
import {
  getReviewStats,
  listAdminReviews,
  setReviewVisibility,
} from '../controllers/review.controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { authorize, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  contactIdValidator,
  readValidator,
} from '../validators/contact.validator.js';
import { newsletterIdValidator } from '../validators/newsletter.validator.js';
import {
  orderIdValidator,
  updateOrderStatusValidator,
} from '../validators/order.validator.js';
import {
  reviewIdValidator,
  visibilityValidator,
} from '../validators/review.validator.js';

const router = Router();

router.use(protect, authorize('admin'));

router.get('/dashboard', asyncHandler(getDashboard));
router.get('/contact-messages', asyncHandler(listContactMessages));
router.patch(
  '/contact-messages/:id/read',
  contactIdValidator,
  readValidator,
  validate,
  asyncHandler(setContactMessageRead),
);
router.delete(
  '/contact-messages/:id',
  contactIdValidator,
  validate,
  asyncHandler(deleteContactMessage),
);
router.get('/newsletter', asyncHandler(listNewsletterSubscribers));
router.delete(
  '/newsletter/:id',
  newsletterIdValidator,
  validate,
  asyncHandler(deleteNewsletterSubscriber),
);
router.get('/insights', asyncHandler(getCartInsights));
router.get('/order-stats', asyncHandler(getOrderStats));
router.get('/orders', asyncHandler(listAllOrders));
router.get('/review-stats', asyncHandler(getReviewStats));
router.get('/reviews', asyncHandler(listAdminReviews));
router.patch(
  '/reviews/:id/visibility',
  reviewIdValidator,
  visibilityValidator,
  validate,
  asyncHandler(setReviewVisibility),
);
router.patch(
  '/orders/:id/status',
  orderIdValidator,
  updateOrderStatusValidator,
  validate,
  asyncHandler(updateOrderStatus),
);

export default router;
