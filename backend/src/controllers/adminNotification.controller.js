import { ContactMessage } from '../models/ContactMessage.js';
import { NewsletterSubscriber } from '../models/NewsletterSubscriber.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Review } from '../models/Review.js';
import { User } from '../models/User.js';

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

export async function getAdminNotifications(req, res) {
  const weekAgo = daysAgo(7);

  const [
    unreadMessages,
    latestMessage,
    pendingOrders,
    latestOrder,
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

  const lowStockCount = await Product.countDocuments({ isActive: true, stock: { $lte: 10 } });
  const notifications = [];

  if (unreadMessages) {
    const names = latestMessage.map((item) => item.subject).join(', ');
    notifications.push({
      id: 'messages',
      icon: 'mail',
      tone: 'indigo',
      title: `${unreadMessages} unread support message${unreadMessages === 1 ? '' : 's'}`,
      message: names ? `Latest: ${names}` : 'Open the inbox to read new messages.',
      time: latestMessage[0]?.createdAt || null,
      count: unreadMessages,
      to: '/messages',
    });
  }

  if (pendingOrders) {
    const names = latestOrder.map((item) => item.orderNumber).filter(Boolean).join(', ');
    notifications.push({
      id: 'orders',
      icon: 'cart',
      tone: 'amber',
      title: `${pendingOrders} order${pendingOrders === 1 ? '' : 's'} need attention`,
      message: names ? `Waiting: ${names}` : 'Review orders waiting to be processed.',
      time: latestOrder[0]?.placedAt || null,
      count: pendingOrders,
      to: '/orders?status=pending',
    });
  }

  if (lowStockCount) {
    const names = lowStock.map((item) => item.name).join(', ');
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
      message: latestReview?.body
        ? `“${latestReview.body.slice(0, 80)}${latestReview.body.length > 80 ? '…' : ''}”`
        : 'Open reviews to moderate hidden feedback.',
      time: latestReview?.createdAt || null,
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

  res.json({
    success: true,
    data: {
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
    },
  });
}
