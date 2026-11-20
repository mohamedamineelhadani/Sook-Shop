import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { AppError } from '../utils/AppError.js';

const PRODUCT_FIELDS = 'name slug brand price compareAtPrice images stock isActive';

const itemKey = (productId, color = '', size = '') =>
  `${productId}::${color || ''}::${size || ''}`;

const normalizeOptions = (body) => ({
  color: typeof body.color === 'string' ? body.color.trim() : '',
  size: typeof body.size === 'string' ? body.size.trim() : '',
});

async function findOrCreateCart(userId) {
  const existing = await Cart.findOne({ user: userId });
  if (existing) return existing;
  return Cart.create({ user: userId, items: [] });
}

function findItem(cart, productId, options) {
  return cart.items.find(
    (item) =>
      item.product.toString() === productId &&
      (item.color || '') === options.color &&
      (item.size || '') === options.size,
  );
}

async function present(cart) {
  await cart.populate({ path: 'items.product', select: PRODUCT_FIELDS });

  const items = [];
  let count = 0;
  let subtotal = 0;

  for (const item of cart.items) {
    const product = item.product;
    if (!product || !product.isActive) continue;

    const quantity = Math.max(1, Math.min(item.quantity, Math.max(1, product.stock)));
    const lineTotal = product.price * quantity;

    items.push({
      key: itemKey(product._id, item.color, item.size),
      productId: product._id,
      product,
      quantity,
      color: item.color || '',
      size: item.size || '',
      lineTotal,
    });
    count += quantity;
    subtotal += lineTotal;
  }

  return { items, count, subtotal };
}

export async function getCart(req, res) {
  const cart = await findOrCreateCart(req.user._id);
  res.json({ success: true, data: await present(cart) });
}

export async function addCartItem(req, res) {
  const { productId } = req.body;
  const options = normalizeOptions(req.body);
  const quantity = Number(req.body.quantity) || 1;

  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) throw new AppError(404, 'Product not found');
  if (product.stock < 1) throw new AppError(400, 'This product is out of stock');

  const cart = await findOrCreateCart(req.user._id);
  const item = findItem(cart, productId, options);

  if (item) item.quantity = Math.min(product.stock, item.quantity + quantity);
  else cart.items.push({ product: product._id, quantity: Math.min(product.stock, quantity), ...options });

  await cart.save();
  res.json({ success: true, data: await present(cart) });
}

export async function updateCartItem(req, res) {
  const { productId } = req.body;
  const options = normalizeOptions(req.body);
  const cart = await findOrCreateCart(req.user._id);
  const item = findItem(cart, productId, options);

  if (!item) throw new AppError(404, 'That item is not in your cart');

  const product = await Product.findById(productId);
  if (!product) throw new AppError(404, 'Product not found');

  item.quantity = Math.max(1, Math.min(product.stock || 1, Number(req.body.quantity) || 1));
  await cart.save();
  res.json({ success: true, data: await present(cart) });
}

export async function removeCartItem(req, res) {
  const options = normalizeOptions(req.body);
  const cart = await findOrCreateCart(req.user._id);
  const index = cart.items.findIndex(
    (item) =>
      item.product.toString() === req.body.productId &&
      (item.color || '') === options.color &&
      (item.size || '') === options.size,
  );

  if (index === -1) throw new AppError(404, 'That item is not in your cart');

  cart.items.splice(index, 1);
  await cart.save();
  res.json({ success: true, data: await present(cart) });
}

export async function clearCart(req, res) {
  const cart = await findOrCreateCart(req.user._id);
  cart.items = [];
  await cart.save();
  res.json({ success: true, data: await present(cart) });
}

export async function syncCart(req, res) {
  const cart = await findOrCreateCart(req.user._id);
  const incoming = req.body.items || [];
  const ids = incoming.map((item) => item.productId);

  const products = ids.length
    ? await Product.find({ _id: { $in: ids }, isActive: true }).select(PRODUCT_FIELDS)
    : [];
  const byId = new Map(products.map((product) => [product._id.toString(), product]));

  for (const entry of incoming) {
    const product = byId.get(entry.productId);
    if (!product || product.stock < 1) continue;

    const options = normalizeOptions(entry);
    const existing = findItem(cart, entry.productId, options);
    const quantity = Math.min(product.stock, Math.max(1, Number(entry.quantity) || 1));

    if (existing) existing.quantity = Math.max(existing.quantity, quantity);
    else cart.items.push({ product: product._id, quantity, ...options });
  }

  await cart.save();
  res.json({ success: true, data: await present(cart) });
}
