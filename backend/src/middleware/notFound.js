import { AppError } from '../utils/AppError.js';

export function notFound(req, res, next) {
  next(new AppError(404, `Route ${req.originalUrl} was not found on this server`));
}
