import { PrismaClient } from '@prisma/client';
import config from '@/config/env.js';

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    log: config.env === 'development' ? ['query', 'warn', 'error'] : ['error']
  });

if (config.env === 'development') {
  global.prisma = prisma;
}
