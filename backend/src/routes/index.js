import { Router } from 'express';

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
      // Added in later steps:
      // auth:  '/api/auth'
      // cart:  '/api/cart'
      // orders:'/api/orders'
      // users: '/api/users'
    },
  });
});

router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);

export default router;
