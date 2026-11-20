import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function emptyResult(tooShort = false) {
  return {
    success: true,
    data: {
      products: [],
      orders: [],
      customers: [],
      totals: { products: 0, orders: 0, customers: 0 },
      tooShort,
      query: '',
    },
  };
}

export async function globalSearch(req, res) {
  const query = String(req.query.q || '').trim();
  if (query.length < 2) return res.json(emptyResult(true));

  const term = escapeRegex(query);
  const pattern = new RegExp(term, 'i');

  const [products, customers, orders, productCount, customerCount, orderCount] = await Promise.all([
    Product.find({
      $or: [
        { name: pattern },
        { slug: pattern },
        { sku: pattern },
        { brand: pattern },
      ],
    })
      .select('name slug sku price stock images')
      .sort({ name: 1 })
      .limit(6)
      .lean(),
    User.find({
      role: 'customer',
      $or: [{ name: pattern }, { email: pattern }, { phone: pattern }],
    })
      .select('name email phone isActive createdAt')
      .sort({ createdAt: -1 })
      .limit(6)
      .lean(),
    Order.find({
      $or: [
        { orderNumber: pattern },
        { 'shippingAddress.fullName': pattern },
        { 'shippingAddress.phone': pattern },
      ],
    })
      .populate('user', 'name email')
      .select('orderNumber total orderStatus placedAt shippingAddress user')
      .sort({ placedAt: -1 })
      .limit(6)
      .lean(),
    Product.countDocuments({
      $or: [{ name: pattern }, { slug: pattern }, { sku: pattern }, { brand: pattern }],
    }),
    User.countDocuments({
      role: 'customer',
      $or: [{ name: pattern }, { email: pattern }, { phone: pattern }],
    }),
    Order.countDocuments({
      $or: [
        { orderNumber: pattern },
        { 'shippingAddress.fullName': pattern },
        { 'shippingAddress.phone': pattern },
      ],
    }),
  ]);

  res.json({
    success: true,
    data: {
      products: products.map((product) => ({
        id: product._id,
        label: product.name,
        detail: product.sku || product.slug,
        meta: `$${Number(product.price || 0).toFixed(2)} · ${product.stock} in stock`,
        to: `/products?q=${encodeURIComponent(product.name)}`,
      })),
      customers: customers.map((customer) => ({
        id: customer._id,
        label: customer.name,
        detail: customer.email,
        meta: customer.isActive ? 'Active' : 'Inactive',
        to: `/users?q=${encodeURIComponent(customer.email)}`,
      })),
      orders: orders.map((order) => ({
        id: order._id,
        label: order.orderNumber || order._id,
        detail: order.user?.name || order.shippingAddress?.fullName || 'Customer',
        meta: `$${Number(order.total || 0).toFixed(2)} · ${order.orderStatus}`,
        to: `/orders?q=${encodeURIComponent(order.orderNumber || order._id)}`,
      })),
      totals: {
        products: productCount,
        customers: customerCount,
        orders: orderCount,
      },
      tooShort: false,
      query,
    },
  });
}
