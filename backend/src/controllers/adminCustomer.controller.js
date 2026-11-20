import { Order } from '../models/Order.js';
import { Review } from '../models/Review.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function paginationFrom(query) {
  return {
    page: Math.max(1, Number.parseInt(query.page, 10) || 1),
    limit: Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 20)),
  };
}

function customerSummary(customer) {
  return {
    id: customer._id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone || '',
    role: customer.role,
    isActive: customer.isActive,
    lastLogin: customer.lastLogin,
    createdAt: customer.createdAt,
    address: customer.address || {},
    orderCount: customer.orderCount || 0,
    totalSpent: customer.totalSpent || 0,
    lastOrderAt: customer.lastOrderAt || null,
    reviewCount: customer.reviewCount || 0,
  };
}

export async function listCustomers(req, res) {
  const { page, limit } = paginationFrom(req.query);
  const match = { role: 'customer' };

  if (req.query.isActive === 'true') match.isActive = true;
  if (req.query.isActive === 'false') match.isActive = false;

  if (req.query.q) {
    const term = escapeRegex(req.query.q);
    match.$or = [
      { name: { $regex: term, $options: 'i' } },
      { email: { $regex: term, $options: 'i' } },
      { phone: { $regex: term, $options: 'i' } },
    ];
  }

  const [rows, filtered, allCount, activeCount, customerOrderStats] = await Promise.all([
    User.aggregate([
      { $match: match },
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      { $lookup: { from: 'orders', localField: '_id', foreignField: 'user', as: 'orders' } },
      { $lookup: { from: 'reviews', localField: '_id', foreignField: 'user', as: 'reviews' } },
      {
        $addFields: {
          paidOrders: {
            $filter: {
              input: { $ifNull: ['$orders', []] },
              as: 'order',
              cond: { $ne: ['$$order.orderStatus', 'cancelled'] },
            },
          },
        },
      },
      {
        $addFields: {
          orderCount: { $size: '$paidOrders' },
          totalSpent: { $sum: '$paidOrders.total' },
          lastOrderAt: { $max: '$orders.placedAt' },
          reviewCount: { $size: { $ifNull: ['$reviews', []] } },
        },
      },
      {
        $project: {
          password: 0,
          wishlist: 0,
          orders: 0,
          reviews: 0,
          paidOrders: 0,
        },
      },
    ]),
    User.countDocuments(match),
    User.countDocuments({ role: 'customer' }),
    User.countDocuments({ role: 'customer', isActive: true }),
    Order.aggregate([
      { $match: { orderStatus: { $ne: 'cancelled' } } },
      { $group: { _id: '$user' } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $match: { 'user.0.role': 'customer' } },
      {
        $group: {
          _id: null,
          withOrders: { $sum: 1 },
        },
      },
    ]),
  ]);

  const orderStats = customerOrderStats[0] || { withOrders: 0 };

  res.json({
    success: true,
    data: rows.map(customerSummary),
    pagination: { page, limit, total: filtered, pages: Math.ceil(filtered / limit) },
    stats: {
      total: allCount,
      active: activeCount,
      inactive: allCount - activeCount,
      withOrders: orderStats.withOrders || 0,
    },
  });
}

export async function getCustomer(req, res) {
  const customer = await User.findOne({ _id: req.params.id, role: 'customer' })
    .select('-password')
    .lean();

  if (!customer) throw new AppError(404, 'Customer not found');

  const [spendRows, orders, reviews, reviewCount] = await Promise.all([
    Order.aggregate([
      { $match: { user: customer._id, orderStatus: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: '$total' },
          orderCount: { $sum: 1 },
        },
      },
    ]),
    Order.find({ user: customer._id })
      .select('orderNumber total orderStatus placedAt')
      .sort({ placedAt: -1 })
      .limit(6)
      .lean({ virtuals: true }),
    Review.find({ user: customer._id })
      .select('rating title body createdAt product isVisible')
      .populate('product', 'name slug images')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    Review.countDocuments({ user: customer._id }),
  ]);

  const spend = spendRows[0] || { totalSpent: 0, orderCount: 0 };

  res.json({
    success: true,
    data: {
      ...customerSummary({ ...customer, ...spend, reviewCount }),
      recentOrders: orders,
      recentReviews: reviews,
    },
  });
}

export async function setCustomerActive(req, res) {
  const customer = await User.findOne({ _id: req.params.id, role: 'customer' });
  if (!customer) throw new AppError(404, 'Customer not found');

  customer.isActive = req.body.isActive;
  await customer.save({ validateBeforeSave: false });

  res.json({
    success: true,
    data: {
      id: customer._id,
      name: customer.name,
      email: customer.email,
      isActive: customer.isActive,
    },
    message: customer.isActive ? 'Customer account activated' : 'Customer account deactivated',
  });
}
