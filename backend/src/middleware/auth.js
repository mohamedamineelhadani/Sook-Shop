import jwt from 'jsonwebtoken';

import { config } from '../config/env.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from './asyncHandler.js';

export const COOKIE_NAME = 'sookshop_token';

function tokenFrom(req) {
  if (req.cookies?.[COOKIE_NAME]) return req.cookies[COOKIE_NAME];
  const authorization = req.headers.authorization;
  if (authorization?.startsWith('Bearer ')) return authorization.slice(7);
  return null;
}

export const protect = asyncHandler(async (req, res, next) => {
  const token = tokenFrom(req);
  if (!token) throw new AppError(401, 'Please log in to continue');

  let decoded;
  try {
    decoded = jwt.verify(token, config.jwtSecret);
  } catch {
    throw new AppError(401, 'Your session is invalid or has expired. Please log in again.');
  }

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) throw new AppError(401, 'This account is no longer active');

  req.user = user;
  next();
});

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError(403, 'You do not have permission to perform this action');
    }
    next();
  };
}
