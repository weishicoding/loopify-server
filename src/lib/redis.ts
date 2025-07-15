import { Redis } from 'ioredis';
import config from '@/config/env.js';
import logger from '@/lib/logger.js';

declare global {
  var ioredis: Redis | undefined;
}

const getRedisInstance = (): Redis => {
  if (global.ioredis) {
    return global.ioredis;
  }

  logger.info('Creating a new ioreids connection');
  const newRedisInstance = new Redis(config.redisUrl, {
    maxRetriesPerRequest: null
  });

  newRedisInstance.on('connect', () => {
    logger.info('✅ A new ioredis connected to server.');
  });

  newRedisInstance.on('error', (err) => {
    logger.error('❌ ioredis connection error:', err);
  });

  if (config.env === 'development') {
    global.ioredis = newRedisInstance;
  }

  return newRedisInstance;
};

export const redis = getRedisInstance();
