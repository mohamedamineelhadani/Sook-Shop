import { Router } from 'express';

import adminRoutes from './admin.routes.js';
import authRoutes from './auth.routes.js';
import cartRoutes from './cart.routes.js';
import categoryRoutes from './category.routes.js';
import orderRoutes from './order.routes.js';
import productRoutes from './product.routes.js';
import reviewRoutes from './review.routes.js';
import wishlistRoutes from './wishlist.routes.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

router.get('/', (req, res) => {
  res.json({
    success: true,
    name: 'Sookshop API',
    version: '1.0.0',
    payment: 'cash on delivery',
    endpoints: {
      health: 'GET /api/health',
      products: '/api/products',
      brands: 'GET /api/products/brands',
      categories: '/api/categories',
      auth: '/api/auth',
      cart: '/api/cart',
      wishlist: '/api/wishlist',
      adminInsights: 'GET /api/admin/insights (admin only)',
      orders: '/api/orders',
      shipping: 'GET /api/orders/shipping',
      adminOrders: '/api/admin/orders (admin only)',
      reviews: '/api/reviews',
      suggest: 'GET /api/products/suggest?q=…',
    },
  });
});

router.use('/auth', authRoutes);
router.use('/cart', cartRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/admin', adminRoutes);
router.use('/orders', orderRoutes);
router.use('/reviews', reviewRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);

export default router;
