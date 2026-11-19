import mongoose from 'mongoose';
import { config } from './env.js';

export async function connectDB() {
  mongoose.set('strictQuery', true);
  const connection = await mongoose.connect(config.mongoUri);
  console.log(
    `MongoDB connected → ${connection.connection.host}/${connection.connection.name}`,
  );
  return connection;
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
