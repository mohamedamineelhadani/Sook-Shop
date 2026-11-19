import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sookshop',
  jwtSecret: process.env.JWT_SECRET || 'sookshop-dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  adminUrl: process.env.ADMIN_URL || 'http://localhost:5174',
  adminName: process.env.ADMIN_NAME || 'Sookshop Admin',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@sookshop.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'Admin@123',
};
