import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

const PRODUCT_FIELDS = 'name slug brand price compareAtPrice images stock isActive';

async function present(user) {
  await user.populate({ path: 'wishlist', select: PRODUCT_FIELDS });
  return (user.wishlist || []).filter((product) => product && product.isActive);
}

export async function getWishlist(req, res) {
  const user = await User.findById(req.user._id);
  res.json({ success: true, data: await present(user) });
}

export async function addToWishlist(req, res) {
  const product = await Product.findOne({ _id: req.params.productId, isActive: true });
  if (!product) throw new AppError(404, 'Product not found');

  const user = await User.findById(req.user._id);
  const alreadySaved = user.wishlist.some((id) => id.toString() === product._id.toString());
  if (!alreadySaved) user.wishlist.push(product._id);

  await user.save({ validateBeforeSave: false });
  res.json({ success: true, data: await present(user) });
}

export async function removeFromWishlist(req, res) {
  const user = await User.findById(req.user._id);
  user.wishlist = user.wishlist.filter(
    (id) => id.toString() !== req.params.productId,
  );

  await user.save({ validateBeforeSave: false });
  res.json({ success: true, data: await present(user) });
}

export async function syncWishlist(req, res) {
  const user = await User.findById(req.user._id);
  const ids = req.body.productIds || [];

  const products = ids.length
    ? await Product.find({ _id: { $in: ids }, isActive: true }).select('_id')
    : [];
  const existing = new Set(user.wishlist.map((id) => id.toString()));
  for (const product of products) {
    const id = product._id.toString();
    if (!existing.has(id)) {
      user.wishlist.push(product._id);
      existing.add(id);
    }
  }

  await user.save({ validateBeforeSave: false });
  res.json({ success: true, data: await present(user) });
}
