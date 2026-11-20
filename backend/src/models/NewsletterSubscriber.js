import mongoose from 'mongoose';

const { Schema } = mongoose;

const newsletterSubscriberSchema = new Schema(
  {
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    source: { type: String, trim: true, default: 'home', maxlength: 40 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

newsletterSubscriberSchema.index({ isActive: 1, createdAt: -1 });

export const NewsletterSubscriber = mongoose.model(
  'NewsletterSubscriber',
  newsletterSubscriberSchema,
);
