import { connectDB, disconnectDB } from '../src/config/db.js';
import { Order } from '../src/models/Order.js';
import { Product } from '../src/models/Product.js';
import { Review } from '../src/models/Review.js';
import { User } from '../src/models/User.js';

const DEMO_PASSWORD = 'Demo@123';

const customers = [
  { name: 'Maya Demo', email: 'maya.demo@sookshop.test', city: 'Cairo' },
  { name: 'Noah Demo', email: 'noah.demo@sookshop.test', city: 'Alexandria' },
  { name: 'Sara Demo', email: 'sara.demo@sookshop.test', city: 'Giza' },
];

const reviewTexts = [
  {
    rating: 5,
    title: 'Exactly what I wanted',
    body: 'Arrived quickly, packed well and works perfectly. Paying cash on delivery was simple.',
  },
  {
    rating: 4,
    title: 'Great value',
    body: 'Good quality for the price. Battery life could be better, but I am happy with this purchase.',
  },
  {
    rating: 5,
    title: 'Would buy again',
    body: 'The product matches the description and the delivery driver was friendly. Recommended.',
  },
  {
    rating: 3,
    title: 'Good, with caveats',
    body: 'Does the job but the packaging was a little damaged. The item itself is fine.',
  },
  {
    rating: 5,
    title: 'Impressed',
    body: 'Better than expected at this price. The cash on delivery option made it risk free to try.',
  },
];

const statuses = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'delivered',
  'cancelled',
];

async function main() {
  await connectDB();

  const products = await Product.find({ isActive: true })
    .sort({ isFeatured: -1, name: 1 })
    .limit(6)
    .lean();

  if (!products.length) {
    throw new Error('No products found. Run "npm run seed" before "npm run seed:demo".');
  }

  const users = [];
  for (const item of customers) {
    let user = await User.findOne({ email: item.email });
    if (!user) user = new User({ email: item.email, password: DEMO_PASSWORD, role: 'customer' });

    user.name = item.name;
    user.phone = '+1 555 010 2030';
    user.address = {
      fullName: item.name,
      phone: '+1 555 010 2030',
      line1: '12 Demo Street',
      city: item.city,
      country: 'Egypt',
    };
    await user.save();
    users.push(user);
  }

  for (let index = 0; index < products.length; index += 1) {
    const user = users[index % users.length];
    const text = reviewTexts[index % reviewTexts.length];
    await Review.findOneAndUpdate(
      { user: user._id, product: products[index]._id },
      { $set: { ...text, isVisible: true, verifiedPurchase: true } },
      { upsert: true, new: true },
    );
  }

  for (const product of products) {
    const rows = await Review.aggregate([
      { $match: { product: product._id, isVisible: true } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ]);
    const count = rows.reduce((sum, row) => sum + row.count, 0);
    const average = count
      ? Math.round((rows.reduce((sum, row) => sum + row._id * row.count, 0) / count) * 10) / 10
      : 0;
    await Product.findByIdAndUpdate(product._id, { $set: { rating: { average, count } } });
  }

  // Keep one featured product low on stock so the dashboard alert has real data.
  const lowStockProduct = products[products.length - 1];
  if (lowStockProduct && lowStockProduct.stock > 4) {
    await Product.findByIdAndUpdate(lowStockProduct._id, { $set: { stock: 4 } });
  }

  // Re-running the demo seed replaces only demo orders, never real customer orders.
  await Order.deleteMany({ orderNumber: /^DEMO-/ });

  for (let index = 0; index < statuses.length; index += 1) {
    const product = products[index % products.length];
    const user = users[index % users.length];
    const quantity = (index % 3) + 1;
    const subtotal = product.price * quantity;
    const shippingFee = subtotal >= 200 ? 0 : 10;
    const placedAt = new Date();
    placedAt.setDate(placedAt.getDate() - (index % 7));
    placedAt.setHours(9 + index, 15, 0, 0);

    await Order.create({
      orderNumber: `DEMO-${String(index + 1).padStart(3, '0')}`,
      user: user._id,
      items: [
        {
          product: product._id,
          name: product.name,
          image: product.images?.[0] || '',
          price: product.price,
          quantity,
        },
      ],
      shippingAddress: {
        fullName: user.name,
        phone: user.phone,
        line1: '12 Demo Street',
        city: user.address.city,
        country: 'Egypt',
      },
      paymentMethod: 'cod',
      paymentStatus: statuses[index] === 'delivered' ? 'paid' : 'pending',
      orderStatus: statuses[index],
      subtotal,
      shippingFee,
      total: subtotal + shippingFee,
      notes: 'Demo order',
      placedAt,
    });
  }

  console.log(
    `Demo data ready: ${users.length} customers, ${products.length} reviews and ${statuses.length} COD orders.`,
  );
  console.log(`Demo customer login: ${customers[0].email} / ${DEMO_PASSWORD}`);
  await disconnectDB();
}

main().catch(async (error) => {
  console.error(error);
  await disconnectDB();
  process.exitCode = 1;
});
