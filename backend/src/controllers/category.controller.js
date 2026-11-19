import { isValidObjectId } from 'mongoose';

import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { AppError } from '../utils/AppError.js';
import { slugify } from '../utils/slugify.js';

function pickCategoryFields(body) {
  const fields = {};
  for (const key of ['name', 'description', 'image', 'parent', 'isActive']) {
    if (body[key] !== undefined) fields[key] = body[key];
  }
  return fields;
}

export async function listCategories(req, res) {
  const filter = req.query.activeOnly === 'true' ? { isActive: true } : {};
  const categories = await Category.find(filter).sort({ name: 1 }).lean();

  const counts = await Promise.all(
    categories.map((category) =>
      Product.countDocuments({ category: category._id, isActive: true }),
    ),
  );

  const data = categories.map((category, index) => ({
    ...category,
    productCount: counts[index],
  }));

  res.json({ success: true, count: data.length, data });
}

export async function getCategory(req, res) {
  const key = req.params.idOrSlug;
  const category = isValidObjectId(key)
    ? await Category.findById(key)
    : await Category.findOne({ slug: key });

  if (!category) throw new AppError(404, 'Category not found');

  const productCount = await Product.countDocuments({
    category: category._id,
    isActive: true,
  });

  res.json({ success: true, data: { ...category.toObject(), productCount } });
}

export async function createCategory(req, res) {
  const fields = pickCategoryFields(req.body);
  const slug = slugify(req.body.slug || fields.name);
  if (!slug) throw new AppError(400, 'A valid category name or slug is required');

  if (await Category.exists({ slug })) {
    throw new AppError(409, `A category with the slug "${slug}" already exists`);
  }

  const category = await Category.create({ ...fields, slug });
  res.status(201).json({ success: true, data: category });
}

export async function updateCategory(req, res) {
  const category = await Category.findById(req.params.id);
  if (!category) throw new AppError(404, 'Category not found');

  const fields = pickCategoryFields(req.body);
  let slug = category.slug;

  if (req.body.slug) slug = slugify(req.body.slug);
  else if (fields.name && fields.name !== category.name) slug = slugify(fields.name);
  if (!slug) throw new AppError(400, 'A valid category slug is required');

  const duplicate = await Category.findOne({ slug, _id: { $ne: category._id } });
  if (duplicate) throw new AppError(409, `A category with the slug "${slug}" already exists`);

  Object.assign(category, fields, { slug });
  await category.save();

  res.json({ success: true, data: category });
}

export async function deleteCategory(req, res) {
  const category = await Category.findById(req.params.id);
  if (!category) throw new AppError(404, 'Category not found');

  const count = await Product.countDocuments({ category: category._id });
  if (count > 0) {
    throw new AppError(
      409,
      `This category still has ${count} product(s). Move or delete them first.`,
    );
  }

  await category.deleteOne();
  res.json({ success: true, message: 'Category deleted' });
}
