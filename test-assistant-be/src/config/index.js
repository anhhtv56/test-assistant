import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

// MongoDB connection
export async function connectMongo() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }
  try {
    await mongoose.connect(uri, {
      maxPoolSize: 10
    });
    logger.info('✅ Connected to MongoDB');
  } catch (error) {
    logger.error('❌ MongoDB connection error:', error.message);
    throw error;
  }
}

// JWT config
export const jwtConfig = {
  accessTokenTtlSec: Number(process.env.JWT_ACCESS_TTL_SEC),
  refreshTokenTtlSec: Number(process.env.JWT_REFRESH_TTL_SEC),
  secret: process.env.JWT_SECRET
}