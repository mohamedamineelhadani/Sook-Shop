import jwt from 'jsonwebtoken';

import { config } from '../config/env.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

const COOKIE_NAME = 'sookshop_token';

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.nodeEnv === 'production',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

function publicUser(user) {
  const object = user.toObject ? user.toObject() : { ...user };
  delete object.password;
  return object;
}

export async function register(req, res) {
  const { name, email, password } = req.body;
  const normalizedEmail = email.toLowerCase();

  if (await User.exists({ email: normalizedEmail })) {
    throw new AppError(409, 'An account with that email already exists');
  }

  const user = await User.create({ name, email: normalizedEmail, password });
  const token = signToken(user);

  res
    .cookie(COOKIE_NAME, token, cookieOptions())
    .status(201)
    .json({ success: true, token, data: publicUser(user) });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user || !user.isActive || !(await user.comparePassword(password))) {
    throw new AppError(401, 'Invalid email or password');
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const token = signToken(user);
  res
    .cookie(COOKIE_NAME, token, cookieOptions())
    .json({ success: true, token, data: publicUser(user) });
}

export async function logout(req, res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.nodeEnv === 'production',
    path: '/',
  });
  res.json({ success: true, message: 'Logged out' });
}

export async function me(req, res) {
  res.json({ success: true, data: req.user });
}
