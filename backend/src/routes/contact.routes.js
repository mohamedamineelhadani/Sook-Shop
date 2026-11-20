import { Router } from 'express';

import { createContactMessage } from '../controllers/contact.controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { createContactValidator } from '../validators/contact.validator.js';

const router = Router();

router.post('/', createContactValidator, validate, asyncHandler(createContactMessage));

export default router;
