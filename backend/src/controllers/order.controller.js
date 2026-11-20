import { randomBytes } from 'node:crypto';

import { Cart } from '../models/Cart.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

// Shared with the storefront through GET /api/orders/shipping.
export const SHIPPING = { fee: 10, freeAbove: 200 };

const PRODUCT_FIELDS = 'name price images stock isActive';

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function paginationFrom(query) {
  return {
    page: Math.max(1, Number.parseInt(query.page, 10) || 1),
    limit: Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 10)),
  };
}

function present(order) {
  const value = typeof order.toJSON === 'function' ? order.toJSON() : order;
  delete value.__v;
  return value;
}

function shippingAddressFrom(body = {}) {
  return {
    fullName: body.fullName,
    phone: body.phone,
    line1: body.line1,
    line2: body.line2 || '',
    city: body.city,
    postalCode: body.postalCode || '',
    country: body.country || '',
  };
}

function generateOrderNumber() {
  const stamp = Date.now().toString(36).toUpperCase();
  return `SOO-${stamp}${randomBytes(2).toString('hex').toUpperCase()}`;
}

export function getShippingConfig(req, res) {
  res.json({
    success: true,
    data: { ...SHIPPING, paymentMethod: 'cod', paymentLabel: 'Cash on delivery' },
  });
}

export async function createOrder(req, res) {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart || !cart.items.length) throw new AppError(400, 'Your cart is empty');

  const ids = [...new Set(cart.items.map((item) => item.product.toString()))];
  const products = ids.length
    ? await Product.find({ _id: { $in: ids }, isActive: true }).select(PRODUCT_FIELDS)
    : [];
  const byId = new Map(products.map((product) => [product._id.toString(), product]));

  const items = [];
  const quantities = new Map();

  for (const line of cart.items) {
    const id = line.product.toString();
    const product = byId.get(id);
    if (!product) throw new AppError(422, 'An item in your cart is no longer available');
    if (product.stock < line.quantity) {
      throw new AppError(422, `Only ${product.stock} of "${product.name}" are in stock`);
    }

    items.push({
      product: product._id,
      name: product.name,
      image: product.images?.[0] || '',
      price: product.price,
      quantity: line.quantity,
      color: line.color || '',
      size: line.size || '',
    });
    quantities.set(id, (quantities.get(id) || 0) + line.quantity);
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = subtotal >= SHIPPING.freeAbove ? 0 : SHIPPING.fee;
  const total = subtotal + shippingFee;

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    user: req.user._id,
    items,
    shippingAddress: shippingAddressFrom(req.body.shippingAddress),
    subtotal,
    shippingFee,
    total,
    notes: req.body.notes || '',
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    orderStatus: 'pending',
  });

  const reduced = [];
  try {
    for (const [id, quantity] of quantities) {
      const result = await Product.updateOne(
        { _id: id, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
      );
      if (result.modifiedCount !== 1) {
        throw new AppError(409, 'Stock changed while placing your order. Please try again.');
      }
      reduced.push({ id, quantity });
    }
  } catch (error) {
    for (const { id, quantity } of reduced) {
      await Product.updateOne({ _id: id }, { $inc: { stock: quantity } });
    }
    await Order.deleteOne({ _id: order._id });
    throw error;
  }

  cart.items = [];
  await cart.save();

  if (req.body.saveAddress) {
    const user = req.user;
    Object.assign(user.address, shippingAddressFrom(req.body.shippingAddress));
    if (req.body.shippingAddress?.phone) user.phone = req.body.shippingAddress.phone.trim();
    await user.save({ validateBeforeSave: false });
  }

  res.status(201).json({ success: true, data: present(order) });
}

export async function listMyOrders(req, res) {
  const { page, limit } = paginationFrom(req.query);
  const filter = { user: req.user._id };

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ placedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: orders.map(present),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function getOrder(req, res) {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) throw new AppError(404, 'Order not found');

  const owner = order.user?._id || order.user;
  if (owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError(403, 'You do not have access to this order');
  }

  res.json({ success: true, data: present(order) });
}

export async function listAllOrders(req, res) {
  const { page, limit } = paginationFrom(req.query);
  const filter = {};

  if (req.query.status) filter.orderStatus = req.query.status;

  if (req.query.q) {
    const term = escapeRegex(req.query.q);
    const users = await User.find({ email: { $regex: term, $options: 'i' } }).select('_id');
    const conditions = [
      { orderNumber: { $regex: term, $options: 'i' } },
      { 'shippingAddress.fullName': { $regex: term, $options: 'i' } },
      { 'shippingAddress.phone': { $regex: term, $options: 'i' } },
    ];
    if (users.length) conditions.push({ user: { $in: users.map((user) => user._id) } });
    filter.$or = conditions;
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'name email')
      .sort({ placedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: orders.map(present),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function getOrderStats(req, res) {
  const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  const [total, byStatus, revenue] = await Promise.all([
    Order.countDocuments({}),
    Promise.all(
      statuses.map(async (status) => ({
        status,
        count: await Order.countDocuments({ orderStatus: status }),
      })),
    ),
    Order.aggregate([
      {
        $group: {
          _id: null,
          orders: { $sum: 1 },
          revenue: {
            $sum: { $cond: [{ $ne: ['$orderStatus', 'cancelled'] }, '$total', 0] },
          },
          collected: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$total', 0] },
          },
        },
      },
    ]),
  ]);

  const summary = revenue[0] || { orders: 0, revenue: 0, collected: 0 };
  res.json({
    success: true,
    data: {
      total,
      byStatus: Object.fromEntries(byStatus.map((entry) => [entry.status, entry.count])),
      revenue: summary.revenue,
      collected: summary.collected,
    },
  });
}

export async function updateOrderStatus(req, res) {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) throw new AppError(404, 'Order not found');

  order.orderStatus = req.body.status;
  if (req.body.status === 'delivered') order.paymentStatus = 'paid';
  await order.save();

  res.json({ success: true, data: present(order) });
}
