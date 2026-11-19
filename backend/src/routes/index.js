import { Router } from 'express';

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
      // Added step by step:
      // products:   '/api/products'
      // categories: '/api/categories'
      // auth:       '/api/auth'
      // cart:       '/api/cart'
      // orders:     '/api/orders'
      // users:      '/api/users'
    },
  });
});

export default router;
