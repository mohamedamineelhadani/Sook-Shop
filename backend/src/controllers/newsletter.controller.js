import { NewsletterSubscriber } from '../models/NewsletterSubscriber.js';
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

function subscriberPayload(subscriber) {
  return {
    id: subscriber._id,
    email: subscriber.email,
    source: subscriber.source,
    isActive: subscriber.isActive,
    subscribedAt: subscriber.createdAt,
  };
}

export async function subscribe(req, res) {
  const email = req.body.email;
  const source = req.body.source || 'home';
  const existing = await NewsletterSubscriber.findOne({ email });

  if (existing) {
    const wasActive = existing.isActive;
    existing.isActive = true;
    existing.source = source;
    await existing.save();

    return res.json({
      success: true,
      data: subscriberPayload(existing),
      alreadySubscribed: wasActive,
      message: wasActive ? 'This email is already on the list' : 'Subscription restored',
    });
  }

  const subscriber = await NewsletterSubscriber.create({ email, source });
  return res.status(201).json({
    success: true,
    data: subscriberPayload(subscriber),
    alreadySubscribed: false,
    message: 'Email saved',
  });
}

export async function unsubscribe(req, res) {
  const subscriber = await NewsletterSubscriber.findOne({ email: req.body.email });
  if (subscriber) {
    subscriber.isActive = false;
    await subscriber.save();
  }

  // Always respond the same way so the endpoint cannot be used to check who subscribed.
  res.json({ success: true, message: 'Email removed from the active list' });
}

export async function listNewsletterSubscribers(req, res) {
  const { page, limit } = paginationFrom(req.query);
  const filter = {};

  if (req.query.isActive === 'true') filter.isActive = true;
  if (req.query.isActive === 'false') filter.isActive = false;

  if (req.query.q) {
    filter.email = { $regex: escapeRegex(req.query.q), $options: 'i' };
  }

  const [subscribers, total, allCount, active] = await Promise.all([
    NewsletterSubscriber.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    NewsletterSubscriber.countDocuments(filter),
    NewsletterSubscriber.countDocuments({}),
    NewsletterSubscriber.countDocuments({ isActive: true }),
  ]);

  res.json({
    success: true,
    data: subscribers,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    stats: { total: allCount, active, inactive: allCount - active },
  });
}

export async function deleteNewsletterSubscriber(req, res) {
  const subscriber = await NewsletterSubscriber.findById(req.params.id);
  if (!subscriber) throw new AppError(404, 'Subscriber not found');

  await subscriber.deleteOne();
  res.json({ success: true, message: 'Subscriber deleted' });
}
