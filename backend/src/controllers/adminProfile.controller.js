import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

function profilePayload(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    role: user.role,
    address: user.address || {},
    lastLogin: user.lastLogin || null,
    createdAt: user.createdAt,
  };
}

export async function getAdminProfile(req, res) {
  res.json({ success: true, data: profilePayload(req.user) });
}

export async function updateAdminProfile(req, res) {
  const email = req.body.email.toLowerCase();
  const taken = await User.exists({ email, _id: { $ne: req.user._id } });
  if (taken) throw new AppError(409, 'An account with that email already exists');

  req.user.name = req.body.name;
  req.user.email = email;
  req.user.phone = req.body.phone || '';
  await req.user.save({ validateBeforeSave: false });

  res.json({
    success: true,
    data: profilePayload(req.user),
    message: 'Profile updated',
  });
}

export async function changeAdminPassword(req, res) {
  const user = await User.findById(req.user._id).select('+password');
  if (!user) throw new AppError(404, 'Admin account not found');

  if (!(await user.comparePassword(req.body.currentPassword))) {
    throw new AppError(400, 'Current password is incorrect');
  }

  if (req.body.newPassword === req.body.currentPassword) {
    throw new AppError(400, 'Choose a new password that is different from the current one');
  }

  user.password = req.body.newPassword;
  await user.save();

  res.json({ success: true, message: 'Password updated. Use it next time you sign in.' });
}
