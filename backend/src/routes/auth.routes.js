import { Router } from 'express';

import { login, logout, me, register } from '../controllers/auth.controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { loginValidator, registerValidator } from '../validators/auth.validator.js';

const router = Router();

router.post('/register', registerValidator, validate, asyncHandler(register));
router.post('/login', loginValidator, validate, asyncHandler(login));
router.post('/logout', asyncHandler(logout));
router.get('/me', protect, asyncHandler(me));

export default router;
