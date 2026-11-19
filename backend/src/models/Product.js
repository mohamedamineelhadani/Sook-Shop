import mongoose from 'mongoose';

const { Schema } = mongoose;

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
    description: { type: String, default: '' },
    brand: { type: String, trim: true, default: '' },
    sku: { type: String, trim: true, uppercase: true, unique: true, sparse: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0, default: 0 },
    images: { type: [String], default: [] },
    stock: { type: Number, required: true, min: 0, default: 0 },
    colors: { type: [String], default: [] },
    sizes: { type: [String], default: [] },
    rating: {
      average: { type: Number, min: 0, max: 5, default: 0 },
      count: { type: Number, min: 0, default: 0 },
    },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

productSchema.virtual('inStock').get(function inStock() {
  return this.stock > 0;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

export const Product = mongoose.model('Product', productSchema);
