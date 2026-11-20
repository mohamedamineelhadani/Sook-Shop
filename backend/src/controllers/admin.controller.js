import { Cart } from '../models/Cart.js';
import { Category } from '../models/Category.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Review } from '../models/Review.js';
import { User } from '../models/User.js';

export async function getCartInsights(req, res) {
  const [cartCount, carts, users] = await Promise.all([
    Cart.countDocuments({}),
    Cart.find({})
      .populate({ path: 'user', select: 'name email' })
      .populate({ path: 'items.product', select: 'name slug price images stock' })
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean(),
    User.find({})
      .select('name email role wishlist createdAt')
      .populate({ path: 'wishlist', select: 'name slug price images stock' })
      .lean(),
  ]);

  const customers = users.filter((user) => user.role === 'customer');
  const cartItems = carts.reduce((sum, cart) => sum + (cart.items?.length || 0), 0);
  const wishlistEntries = users.reduce((sum, user) => sum + (user.wishlist?.length || 0), 0);
  const savedProducts = new Set();
  users.forEach((user) =>
    (user.wishlist || []).forEach((product) => product && savedProducts.add(product._id.toString())),
  );

  const popularity = new Map();
  const track = (product, field) => {
    if (!product) return;
    const id = product._id.toString();
    if (!popularity.has(id)) {
      popularity.set(id, {
        id,
        name: product.name,
        image: product.images?.[0] || '',
        price: product.price,
        inCarts: 0,
        inWishlists: 0,
      });
    }
    popularity.get(id)[field] += 1;
  };

  const cartList = carts.map((cart) => ({
    id: cart._id,
    user: cart.user
      ? { id: cart.user._id, name: cart.user.name, email: cart.user.email }
      : null,
    items: (cart.items || [])
      .filter((item) => item.product)
      .map((item) => ({
        productId: item.product._id,
        name: item.product.name,
        image: item.product.images?.[0] || '',
        price: item.product.price,
        quantity: item.quantity,
      })),
    updatedAt: cart.updatedAt,
  }));

  cartList.forEach((cart) =>
    carts
      .find((entry) => entry._id.toString() === cart.id.toString())
      ?.items?.forEach((item) => track(item.product, 'inCarts')),
  );

  const wishlistList = customers
    .filter((user) => user.wishlist?.length)
    .map((user) => ({
      id: user._id,
      name: user.name,
      email: user.email,
      products: user.wishlist.filter(Boolean).map((product) => {
        track(product, 'inWishlists');
        return {
          id: product._id,
          name: product.name,
          image: product.images?.[0] || '',
          price: product.price,
        };
      }),
    }));

  const popular = [...popularity.values()]
    .sort((a, b) => b.inCarts + b.inWishlists - (a.inCarts + a.inWishlists))
    .slice(0, 8);

  res.json({
    success: true,
    data: {
      stats: {
        carts: cartCount,
        cartItems,
        customers: customers.length,
        wishlistEntries,
        savedProducts: savedProducts.size,
      },
      carts: cartList,
      wishlists: wishlistList,
      popular,
    },
  });
}

const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

function dayKey(value) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

// One request for everything the admin dashboard needs: headline numbers,
// a 7-day activity chart, status breakdown and actionable lists.
export async function getDashboard(req, res) {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - 6);

  const [
    productCount,
    categoryCount,
    customerCount,
    orderTotals,
    statusRows,
    reviewRows,
    hiddenReviews,
    lowStockCount,
    lowStock,
    recentOrders,
    recentOrderDocs,
    topProducts,
  ] = await Promise.all([
    Product.countDocuments({ isActive: true }),
    Category.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'customer' }),
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
    Order.aggregate([{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }]),
    Review.aggregate([{ $group: { _id: '$rating', count: { $sum: 1 } } }]),
    Review.countDocuments({ isVisible: false }),
    Product.countDocuments({ isActive: true, stock: { $lte: 10 } }),
    Product.find({ isActive: true, stock: { $lte: 10 } })
      .select('name slug stock images price')
      .sort({ stock: 1 })
      .limit(6)
      .lean(),
    Order.find({})
      .populate('user', 'name')
      .sort({ placedAt: -1 })
      .limit(6)
      .lean(),
    Order.find({ placedAt: { $gte: since } })
      .select('placedAt total orderStatus')
      .lean(),
    Order.aggregate([
      { $match: { orderStatus: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          image: { $first: '$items.image' },
          sold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { sold: -1 } },
      { $limit: 5 },
    ]),
  ]);

  const totals = orderTotals[0] || { orders: 0, revenue: 0, collected: 0 };

  const byStatus = Object.fromEntries(
    ORDER_STATUSES.map((status) => [
      status,
      statusRows.find((row) => row._id === status)?.count || 0,
    ]),
  );

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let reviewCount = 0;
  let reviewSum = 0;
  for (const row of reviewRows) {
    distribution[row._id] = row.count;
    reviewCount += row.count;
    reviewSum += row._id * row.count;
  }

  const daily = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(since);
    date.setDate(since.getDate() + index);
    return {
      date: dayKey(date),
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      orders: 0,
      revenue: 0,
    };
  });
  const buckets = new Map(daily.map((day) => [day.date, day]));
  for (const order of recentOrderDocs) {
    const bucket = buckets.get(dayKey(order.placedAt));
    if (!bucket) continue;
    bucket.orders += 1;
    if (order.orderStatus !== 'cancelled') bucket.revenue += order.total || 0;
  }

  res.json({
    success: true,
    data: {
      stats: {
        products: productCount,
        categories: categoryCount,
        customers: customerCount,
        orders: totals.orders,
        revenue: totals.revenue,
        collected: totals.collected,
        reviews: reviewCount,
        hiddenReviews,
        lowStock: lowStockCount,
      },
      byStatus,
      reviews: {
        average: reviewCount ? Math.round((reviewSum / reviewCount) * 10) / 10 : 0,
        distribution,
      },
      daily,
      recentOrders: recentOrders.map((order) => ({
        id: order._id,
        orderNumber: order.orderNumber,
        customer: order.user?.name || order.shippingAddress?.fullName || 'Customer',
        total: order.total,
        itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
        status: order.orderStatus,
        placedAt: order.placedAt,
      })),
      lowStock: lowStock.map((product) => ({
        id: product._id,
        name: product.name,
        slug: product.slug,
        stock: product.stock,
        image: product.images?.[0] || '',
        price: product.price,
      })),
      topProducts: topProducts.map((product) => ({
        id: product._id,
        name: product.name,
        image: product.image || '',
        sold: product.sold,
        revenue: product.revenue,
      })),
    },
  });
}
