import { ADMIN_NOTIFICATION_IDS } from '../constants/notifications.js';
import { ContactMessage } from '../models/ContactMessage.js';
import { NewsletterSubscriber } from '../models/NewsletterSubscriber.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Review } from '../models/Review.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function normalizeReads(reads) {
  if (!reads || typeof reads !== 'object' || Array.isArray(reads)) return {};
  return reads;
}

function markedCount(reads, id) {
  const marker = normalizeReads(reads)[id];
  const count = Number(marker?.count ?? marker ?? 0);
  return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
}

function remainingCount(rawCount, reads, id) {
  return Math.max(0, (Number(rawCount) || 0) - markedCount(reads, id));
}

async function getRawNotificationData() {
  const weekAgo = daysAgo(7);

  const [
    unreadMessages,
    latestMessage,
    pendingOrders,
    latestOrder,
    lowStockCount,
    lowStock,
    hiddenReviews,
    latestReview,
    newSubscribers,
    newCustomers,
  ] = await Promise.all([
    ContactMessage.countDocuments({ isRead: false }),
    ContactMessage.find({ isRead: false }).sort({ createdAt: -1 }).limit(2).lean(),
    Order.countDocuments({ orderStatus: { $in: ['pending', 'confirmed'] } }),
    Order.find({ orderStatus: { $in: ['pending', 'confirmed'] } })
      .select('orderNumber total placedAt')
      .sort({ placedAt: -1 })
      .limit(2)
      .lean(),
    Product.countDocuments({ isActive: true, stock: { $lte: 10 } }),
    Product.find({ isActive: true, stock: { $lte: 10 } })
      .select('name stock price')
      .sort({ stock: 1 })
      .limit(3)
      .lean(),
    Review.countDocuments({ isVisible: false }),
    Review.findOne({ isVisible: false }).select('rating body createdAt').sort({ createdAt: -1 }).lean(),
    NewsletterSubscriber.countDocuments({ isActive: true, createdAt: { $gte: weekAgo } }),
    User.countDocuments({ role: 'customer', createdAt: { $gte: weekAgo } }),
  ]);

  return {
    counts: {
      messages: unreadMessages,
      orders: pendingOrders,
      stock: lowStockCount,
      reviews: hiddenReviews,
      newsletter: newSubscribers,
      customers: newCustomers,
    },
    samples: {
      messages: latestMessage,
      orders: latestOrder,
      stock: lowStock,
      reviews: latestReview,
    },
  };
}

function buildNotificationPayload(rawData, reads) {
  const { counts, samples } = rawData;

  const unreadMessages = remainingCount(counts.messages, reads, 'messages');
  const pendingOrders = remainingCount(counts.orders, reads, 'orders');
  const lowStockCount = remainingCount(counts.stock, reads, 'stock');
  const hiddenReviews = remainingCount(counts.reviews, reads, 'reviews');
  const newSubscribers = remainingCount(counts.newsletter, reads, 'newsletter');
  const newCustomers = remainingCount(counts.customers, reads, 'customers');

  const notifications = [];

  if (unreadMessages) {
    const names = samples.messages.map((item) => item.subject).join(', ');
    notifications.push({
      id: 'messages',
      icon: 'mail',
      tone: 'indigo',
      title: `${unreadMessages} unread support message${unreadMessages === 1 ? '' : 's'}`,
      message: names ? `Latest: ${names}` : 'Open the inbox to read new messages.',
      time: samples.messages[0]?.createdAt || null,
      count: unreadMessages,
      to: '/messages',
    });
  }

  if (pendingOrders) {
    const names = samples.orders.map((item) => item.orderNumber).filter(Boolean).join(', ');
    notifications.push({
      id: 'orders',
      icon: 'cart',
      tone: 'amber',
      title: `${pendingOrders} order${pendingOrders === 1 ? '' : 's'} need attention`,
      message: names ? `Waiting: ${names}` : 'Review orders waiting to be processed.',
      time: samples.orders[0]?.placedAt || null,
      count: pendingOrders,
      to: '/orders?status=pending',
    });
  }

  if (lowStockCount) {
    const names = samples.stock.map((item) => item.name).join(', ');
    notifications.push({
      id: 'stock',
      icon: 'alert',
      tone: 'rose',
      title: `${lowStockCount} product${lowStockCount === 1 ? '' : 's'} low on stock`,
      message: names ? `Check: ${names}` : 'Update stock levels from the catalog.',
      time: null,
      count: lowStockCount,
      to: '/products?stock=low',
    });
  }

  if (hiddenReviews) {
    notifications.push({
      id: 'reviews',
      icon: 'star',
      tone: 'amber',
      title: `${hiddenReviews} hidden review${hiddenReviews === 1 ? '' : 's'}`,
      message: samples.reviews?.body
        ? `“${samples.reviews.body.slice(0, 80)}${samples.reviews.body.length > 80 ? '…' : ''}”`
        : 'Open reviews to moderate hidden feedback.',
      time: samples.reviews?.createdAt || null,
      count: hiddenReviews,
      to: '/reviews?visibility=hidden',
    });
  }

  if (newSubscribers) {
    notifications.push({
      id: 'newsletter',
      icon: 'send',
      tone: 'green',
      title: `${newSubscribers} new newsletter signup${newSubscribers === 1 ? '' : 's'}`,
      message: 'Emails captured from the home page this week.',
      time: null,
      count: newSubscribers,
      to: '/newsletter',
    });
  }

  if (newCustomers) {
    notifications.push({
      id: 'customers',
      icon: 'users',
      tone: 'purple',
      title: `${newCustomers} new customer${newCustomers === 1 ? '' : 's'} this week`,
      message: 'Accounts registered in the last seven days.',
      time: null,
      count: newCustomers,
      to: '/users',
    });
  }

  notifications.sort(
    (a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime(),
  );

  const unread = notifications.reduce((sum, item) => sum + item.count, 0);

  return {
    notifications,
    unread,
    summary: {
      unreadMessages,
      pendingOrders,
      lowStock: lowStockCount,
      hiddenReviews,
      newSubscribers,
      newCustomers,
    },
  };
}

export async function getAdminNotifications(req, res) {
  const rawData = await getRawNotificationData();
  res.json({
    success: true,
    data: buildNotificationPayload(rawData, req.user.notificationReads),
  });
}

export async function markAdminNotificationRead(req, res) {
  const { id } = req.params;
  if (!ADMIN_NOTIFICATION_IDS.includes(id)) {
    throw new AppError(422, 'Invalid notification id');
  }

  const rawData = await getRawNotificationData();
  const reads = { ...normalizeReads(req.user.notificationReads) };

  reads[id] = {
    count: rawData.counts[id] || 0,
    readAt: new Date().toISOString(),
  };

  req.user.notificationReads = reads;
  req.user.markModified('notificationReads');
  await req.user.save({ validateBeforeSave: false });

  res.json({
    success: true,
    data: buildNotificationPayload(rawData, reads),
    message: 'Notification marked as read',
  });
}
