import { Router } from 'express';

import {
  createReview,
  deleteReview,
  listReviews,
  updateReview,
} from '../controllers/review.controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { optionalAuth, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createReviewValidator,
  reviewIdValidator,
  updateReviewValidator,
} from '../validators/review.validator.js';

const router = Router();

// Public, but personalises "your review" when a token is sent.
router.get('/', optionalAuth, asyncHandler(listReviews));

router.use(protect);

router.post('/', createReviewValidator, validate, asyncHandler(createReview));
router.put(
  '/:id',
  reviewIdValidator,
  updateReviewValidator,
  validate,
  asyncHandler(updateReview),
);
router.delete('/:id', reviewIdValidator, validate, asyncHandler(deleteReview));

export default router;
