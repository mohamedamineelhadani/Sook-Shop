import { isValidObjectId, Types } from 'mongoose';

import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Review } from '../models/Review.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

const SORTS = {
  newest: { createdAt: -1 },
  highest: { rating: -1, createdAt: -1 },
  lowest: { rating: 1, createdAt: -1 },
};

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function paginationFrom(query) {
  return {
    page: Math.max(1, Number.parseInt(query.page, 10) || 1),
    limit: Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 10)),
  };
}

async function ratingSummary(productId) {
  const rows = await Review.aggregate([
    { $match: { product: new Types.ObjectId(productId), isVisible: true } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
  ]);
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let total = 0;
  let sum = 0;
  for (const row of rows) {
    distribution[row._id] = row.count;
    total += row.count;
    sum += row._id * row.count;
  }
  return {
    count: total,
    average: total ? Math.round((sum / total) * 10) / 10 : 0,
    distribution,
  };
}

async function recalculateProductRating(productId) {
  const summary = await ratingSummary(productId);
  await Product.findByIdAndUpdate(productId, {
    $set: { rating: { average: summary.average, count: summary.count } },
  });
}

async function resolveProductId(key) {
  if (!key) throw new AppError(400, 'A product is required');
  if (isValidObjectId(key)) {
    if (!(await Product.exists({ _id: key }))) throw new AppError(404, 'Product not found');
    return key;
  }
  const product = await Product.findOne({ slug: key }).select('_id');
  if (!product) throw new AppError(404, 'Product not found');
  return product._id.toString();
}

async function verifiedPurchase(userId, productId) {
  return Boolean(
    await Order.exists({
      user: userId,
      orderStatus: 'delivered',
      'items.product': new Types.ObjectId(productId),
    }),
  );
}

export async function listReviews(req, res) {
  const productId = await resolveProductId(req.query.product);
  const { page, limit } = paginationFrom(req.query);
  const filter = { product: productId, isVisible: true };

  const rating = Number.parseInt(req.query.rating, 10);
  if (rating >= 1 && rating <= 5) filter.rating = rating;

  const [reviews, total, mine] = await Promise.all([
    Review.find(filter)
      .populate('user', 'name')
      .sort(SORTS[req.query.sort] || SORTS.newest)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Review.countDocuments(filter),
    req.user ? Review.findOne({ product: productId, user: req.user._id }).lean() : Promise.resolve(null),
  ]);

  res.json({
    success: true,
    data: reviews,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    mine,
    summary: await ratingSummary(productId),
  });
}

export async function createReview(req, res) {
  const product = await Product.findOne({ _id: req.body.productId, isActive: true });
  if (!product) throw new AppError(404, 'Product not found');

  const fields = {
    rating: req.body.rating,
    title: req.body.title || '',
    body: req.body.body,
    verifiedPurchase: await verifiedPurchase(req.user._id, product._id),
  };

  let review = await Review.findOne({ user: req.user._id, product: product._id });
  const created = !review;
  if (review) Object.assign(review, fields);
  else review = new Review({ ...fields, user: req.user._id, product: product._id });

  await review.save();
  await recalculateProductRating(product._id);
  await review.populate('user', 'name');

  res
    .status(created ? 201 : 200)
    .json({ success: true, data: review, message: created ? 'Review added' : 'Review updated' });
}

export async function updateReview(req, res) {
  const review = await Review.findById(req.params.id);
  if (!review) throw new AppError(404, 'Review not found');
  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError(403, 'You can only edit your own review');
  }

  Object.assign(review, {
    rating: req.body.rating,
    title: req.body.title || '',
    body: req.body.body,
  });
  await review.save();
  await recalculateProductRating(review.product);
  await review.populate('user', 'name');

  res.json({ success: true, data: review, message: 'Review updated' });
}

export async function deleteReview(req, res) {
  const review = await Review.findById(req.params.id);
  if (!review) throw new AppError(404, 'Review not found');
  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError(403, 'You can only delete your own review');
  }

  await review.deleteOne();
  await recalculateProductRating(review.product);
  res.json({ success: true, message: 'Review deleted' });
}

export async function listAdminReviews(req, res) {
  const { page, limit } = paginationFrom(req.query);
  const filter = {};

  const rating = Number.parseInt(req.query.rating, 10);
  if (rating >= 1 && rating <= 5) filter.rating = rating;
  if (req.query.visibility === 'hidden') filter.isVisible = false;
  if (req.query.visibility === 'visible') filter.isVisible = true;

  if (req.query.q) {
    const term = escapeRegex(req.query.q);
    const users = await User.find({ name: { $regex: term, $options: 'i' } }).select('_id');
    const products = await Product.find({ name: { $regex: term, $options: 'i' } }).select('_id');
    const conditions = [
      { title: { $regex: term, $options: 'i' } },
      { body: { $regex: term, $options: 'i' } },
    ];
    if (users.length) conditions.push({ user: { $in: users.map((user) => user._id) } });
    if (products.length) conditions.push({ product: { $in: products.map((product) => product._id) } });
    filter.$or = conditions;
  }

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('user', 'name email')
      .populate({ path: 'product', select: 'name slug images' })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Review.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: reviews,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function getReviewStats(req, res) {
  const [total, hidden, rows] = await Promise.all([
    Review.countDocuments({}),
    Review.countDocuments({ isVisible: false }),
    Review.aggregate([{ $group: { _id: '$rating', count: { $sum: 1 } } }]),
  ]);

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  for (const row of rows) {
    distribution[row._id] = row.count;
    sum += row._id * row.count;
  }

  res.json({
    success: true,
    data: {
      total,
      visible: total - hidden,
      hidden,
      average: total ? Math.round((sum / total) * 10) / 10 : 0,
      distribution,
    },
  });
}

export async function setReviewVisibility(req, res) {
  const review = await Review.findById(req.params.id);
  if (!review) throw new AppError(404, 'Review not found');

  review.isVisible = req.body.isVisible;
  await review.save();
  await recalculateProductRating(review.product);
  await review.populate('user', 'name');
  await review.populate({ path: 'product', select: 'name slug images' });

  res.json({
    success: true,
    data: review,
    message: review.isVisible ? 'Review visible again' : 'Review hidden',
  });
}
