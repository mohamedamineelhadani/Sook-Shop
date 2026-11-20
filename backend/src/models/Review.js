import mongoose from 'mongoose';

const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, default: '', maxlength: 120 },
    body: { type: String, required: true, trim: true, maxlength: 1000 },
    isVisible: { type: Boolean, default: true },
    verifiedPurchase: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// One review per customer per product — the API updates the existing review instead.
reviewSchema.index({ user: 1, product: 1 }, { unique: true });
reviewSchema.index({ product: 1, isVisible: 1, createdAt: -1 });

export const Review = mongoose.model('Review', reviewSchema);
