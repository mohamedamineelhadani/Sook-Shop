import { isValidObjectId } from 'mongoose';

import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { Review } from '../models/Review.js';
import { AppError } from '../utils/AppError.js';
import { slugify } from '../utils/slugify.js';

const SORT_OPTIONS = {
  newest: { createdAt: -1 },
  popular: { 'rating.count': -1, createdAt: -1 },
  rating: { 'rating.average': -1, 'rating.count': -1 },
  'price-asc': { price: 1 },
  'price-desc': { price: -1 },
  name: { name: 1 },
  'name-desc': { name: -1 },
};

const EDITABLE_FIELDS = [
  'name',
  'description',
  'brand',
  'sku',
  'category',
  'price',
  'compareAtPrice',
  'images',
  'stock',
  'colors',
  'sizes',
  'isFeatured',
  'isActive',
];

function pickProductFields(body) {
  const fields = {};
  for (const key of EDITABLE_FIELDS) {
    if (body[key] !== undefined) fields[key] = body[key];
  }
  return fields;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function resolveCategoryIds(value) {
  const keys = String(value)
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean);
  const ids = [];

  for (const key of keys) {
    if (isValidObjectId(key)) {
      ids.push(key);
      continue;
    }
    const category = await Category.findOne({ slug: key }).select('_id');
    if (category) ids.push(category._id);
  }

  return { keys, ids };
}

function emptyResult(page, limit) {
  return { success: true, data: [], pagination: { page, limit, total: 0, pages: 0 } };
}

export async function listProducts(req, res) {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(48, Math.max(1, Number.parseInt(req.query.limit, 10) || 12));

  const filter = {};
  if (req.query.includeInactive !== 'true') filter.isActive = true;

  if (req.query.category) {
    const { keys, ids } = await resolveCategoryIds(req.query.category);
    if (keys.length && !ids.length) return res.json(emptyResult(page, limit));
    filter.category = { $in: ids };
  }

  if (req.query.q) {
    const pattern = escapeRegex(req.query.q);
    const matchingCategories = await Category.find({
      $or: [
        { name: { $regex: pattern, $options: 'i' } },
        { slug: { $regex: pattern, $options: 'i' } },
      ],
    }).select('_id');

    filter.$or = [
      { name: { $regex: pattern, $options: 'i' } },
      { slug: { $regex: pattern, $options: 'i' } },
      { brand: { $regex: pattern, $options: 'i' } },
      { sku: { $regex: pattern, $options: 'i' } },
      { description: { $regex: pattern, $options: 'i' } },
    ];
    if (matchingCategories.length) {
      filter.$or.push({ category: { $in: matchingCategories.map((item) => item._id) } });
    }
  }

  if (req.query.min || req.query.max) {
    filter.price = {};
    if (req.query.min) filter.price.$gte = Number(req.query.min);
    if (req.query.max) filter.price.$lte = Number(req.query.max);
  }

  if (req.query.brand) {
    filter.brand = { $in: String(req.query.brand).split(',').map((b) => b.trim()) };
  }

  if (req.query.featured === 'true') filter.isFeatured = true;
  if (req.query.inStock === 'true') filter.stock = { $gt: 0 };
  if (req.query.onSale === 'true') filter.compareAtPrice = { $gt: 0 };
  if (req.query.minRating) {
    filter['rating.average'] = { $gte: Number(req.query.minRating) };
  }

  const sort = SORT_OPTIONS[req.query.sort] || SORT_OPTIONS.newest;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug image')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: products,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function listBrands(req, res) {
  const brands = await Product.distinct('brand', { isActive: true, brand: { $ne: '' } });
  res.json({ success: true, data: brands.filter(Boolean).sort((a, b) => a.localeCompare(b)) });
}

export async function suggestProducts(req, res) {
  const term = String(req.query.q || '').trim();
  if (term.length < 2) return res.json({ success: true, data: [] });

  const pattern = escapeRegex(term);
  const products = await Product.find({
    isActive: true,
    $or: [
      { name: { $regex: pattern, $options: 'i' } },
      { brand: { $regex: pattern, $options: 'i' } },
      { sku: { $regex: pattern, $options: 'i' } },
    ],
  })
    .select('name slug brand price images')
    .sort({ isFeatured: -1, name: 1 })
    .limit(6)
    .lean();

  res.json({ success: true, data: products });
}

export async function getProduct(req, res) {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true })
    .populate('category', 'name slug image')
    .lean();

  if (!product) throw new AppError(404, 'Product not found');

  const related = await Product.find({
    category: product.category?._id,
    _id: { $ne: product._id },
    isActive: true,
  })
    .limit(5)
    .lean();

  const [latestReviews, ratingRows] = await Promise.all([
    Review.find({ product: product._id, isVisible: true })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(3)
      .lean(),
    Review.aggregate([
      { $match: { product: product._id, isVisible: true } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ]),
  ]);

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratingRows.forEach((row) => {
    distribution[row._id] = row.count;
  });

  res.json({
    success: true,
    data: product,
    related,
    reviewSummary: { latest: latestReviews, distribution },
  });
}

export async function createProduct(req, res) {
  const fields = pickProductFields(req.body);
  const slug = slugify(req.body.slug || fields.name);
  if (!slug) throw new AppError(400, 'A valid product name or slug is required');

  if (await Product.exists({ slug })) {
    throw new AppError(409, `A product with the slug "${slug}" already exists`);
  }
  if (!(await Category.exists({ _id: fields.category }))) {
    throw new AppError(404, 'Category not found');
  }

  const product = await Product.create({ ...fields, slug });
  res.status(201).json({ success: true, data: product });
}

export async function updateProduct(req, res) {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError(404, 'Product not found');

  const fields = pickProductFields(req.body);
  let slug = product.slug;

  if (req.body.slug) slug = slugify(req.body.slug);
  else if (fields.name && fields.name !== product.name) slug = slugify(fields.name);
  if (!slug) throw new AppError(400, 'A valid product slug is required');

  const duplicate = await Product.findOne({ slug, _id: { $ne: product._id } });
  if (duplicate) throw new AppError(409, `A product with the slug "${slug}" already exists`);

  if (fields.category && !(await Category.exists({ _id: fields.category }))) {
    throw new AppError(404, 'Category not found');
  }

  Object.assign(product, fields, { slug });
  await product.save();

  res.json({ success: true, data: product });
}

export async function deleteProduct(req, res) {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new AppError(404, 'Product not found');
  res.json({ success: true, message: 'Product deleted' });
}
