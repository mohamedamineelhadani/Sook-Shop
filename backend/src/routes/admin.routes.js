import { Router } from 'express';

import { getCartInsights } from '../controllers/admin.controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { authorize, protect } from '../middleware/auth.js';

const router = Router();

router.use(protect, authorize('admin'));

router.get('/insights', asyncHandler(getCartInsights));

export default router;
