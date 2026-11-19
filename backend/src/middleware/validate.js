import { validationResult } from 'express-validator';

import { AppError } from '../utils/AppError.js';

export function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const details = result.array().map(({ path, msg }) => ({ field: path, message: msg }));
  next(new AppError(422, 'Validation failed', details));
}
