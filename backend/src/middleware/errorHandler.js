import { config } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

function normalizeError(error) {
  if (error instanceof AppError) return error;

  if (error.name === 'CastError') {
    return new AppError(400, `Invalid value for field "${error.path}": ${error.value}`);
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0] || 'field';
    return new AppError(409, `A record with that ${field} already exists`);
  }

  if (error.name === 'ValidationError') {
    const message = Object.values(error.errors || {})
      .map((item) => item.message)
      .join('. ');
    return new AppError(400, message || 'Validation failed');
  }

  if (error.name === 'JsonWebTokenError') {
    return new AppError(401, 'Invalid token');
  }

  if (error.name === 'TokenExpiredError') {
    return new AppError(401, 'Token has expired');
  }

  return error;
}

export function errorHandler(error, req, res, next) {
  const err = normalizeError(error);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Something went wrong';

  if (statusCode >= 500 && config.nodeEnv === 'development') {
    console.error(error);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(err.details ? { details: err.details } : {}),
    ...(statusCode >= 500 && config.nodeEnv === 'development'
      ? { stack: error.stack }
      : {}),
  });
}
