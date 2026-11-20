import { ContactMessage } from '../models/ContactMessage.js';
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

export async function createContactMessage(req, res) {
  const message = await ContactMessage.create({
    name: req.body.name,
    email: req.body.email,
    subject: req.body.subject || 'General question',
    message: req.body.message,
  });

  res.status(201).json({
    success: true,
    data: {
      id: message._id,
      name: message.name,
      email: message.email,
      subject: message.subject,
      createdAt: message.createdAt,
    },
    message: 'Message saved. Our team will see it in the admin inbox.',
  });
}

export async function listContactMessages(req, res) {
  const { page, limit } = paginationFrom(req.query);
  const filter = {};

  if (req.query.isRead === 'true') filter.isRead = true;
  if (req.query.isRead === 'false') filter.isRead = false;

  if (req.query.q) {
    const term = escapeRegex(req.query.q);
    filter.$or = [
      { name: { $regex: term, $options: 'i' } },
      { email: { $regex: term, $options: 'i' } },
      { subject: { $regex: term, $options: 'i' } },
      { message: { $regex: term, $options: 'i' } },
    ];
  }

  const [messages, total, allCount, unread] = await Promise.all([
    ContactMessage.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    ContactMessage.countDocuments(filter),
    ContactMessage.countDocuments({}),
    ContactMessage.countDocuments({ isRead: false }),
  ]);

  res.json({
    success: true,
    data: messages,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    stats: { total: allCount, unread, read: allCount - unread },
  });
}

export async function setContactMessageRead(req, res) {
  const message = await ContactMessage.findById(req.params.id);
  if (!message) throw new AppError(404, 'Message not found');

  message.isRead = req.body.isRead;
  await message.save();

  res.json({
    success: true,
    data: message,
    message: message.isRead ? 'Message marked as read' : 'Message marked as unread',
  });
}

export async function deleteContactMessage(req, res) {
  const message = await ContactMessage.findById(req.params.id);
  if (!message) throw new AppError(404, 'Message not found');

  await message.deleteOne();
  res.json({ success: true, message: 'Message deleted' });
}
