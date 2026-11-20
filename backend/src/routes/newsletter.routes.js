import { Router } from 'express';

import { subscribe, unsubscribe } from '../controllers/newsletter.controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import {
  subscribeValidator,
  unsubscribeValidator,
} from '../validators/newsletter.validator.js';

const router = Router();

router.post('/subscribe', subscribeValidator, validate, asyncHandler(subscribe));
router.post('/unsubscribe', unsubscribeValidator, validate, asyncHandler(unsubscribe));

export default router;
