import app from './app.js';
import { config } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';

async function startServer() {
  try {
    await connectDB();

    const server = app.listen(config.port, () => {
      console.log(`Sookshop API is running at http://localhost:${config.port}/api`);
    });

    const shutdown = async (signal) => {
      console.log(`\n${signal} received — shutting down gracefully...`);
      server.close(async () => {
        await disconnectDB();
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('Failed to start Sookshop API:', error.message);
    process.exit(1);
  }
}

startServer();
