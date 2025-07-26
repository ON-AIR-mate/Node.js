import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
  password: process.env.REDIS_PASSWORD || undefined,
});

redis.on('connect', () => {
  console.log('🔗 Redis connected');
});

redis.on('error', err => {
  console.error('❌ Redis connection error:', err);
});

export default redis;
