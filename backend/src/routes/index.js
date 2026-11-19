import { Router } from 'express';

import authRoutes from './auth.routes.js';
import categoryRoutes from './category.routes.js';
import productRoutes from './product.routes.js';

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
      // Added in later steps:
      // cart:  '/api/cart'
      // orders:'/api/orders'
      // users: '/api/users'
    },
  });
});

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);

export default router;
