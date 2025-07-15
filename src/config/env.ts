import path from 'path';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  PORT: z.coerce.number().default(3000),
  JWT_SECRET: z.string(),
  JWT_ACCESS_EXPIRATION_IN_MINITES: z.coerce.number().positive().int(),
  JWT_REFRESS_EXPIRATION_IN_DAYS: z.coerce.number().positive().int(),
  SMTP_HOST: z.string(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USERNAME: z.string(),
  SMTP_PASSWORD: z.string()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Env configuration validation error: ${parsed.error.message}`);
}

const env = parsed.data;

export default {
  env: env.NODE_ENV,
  port: env.PORT,
  databaseUrl: env.DATABASE_URL,
  redisUrl: env.REDIS_URL,

  //jwt
  jwt: {
    secret: env.JWT_SECRET,
    accessExpirationInMinutes: env.JWT_ACCESS_EXPIRATION_IN_MINITES,
    refreshExpirationInDays: env.JWT_REFRESS_EXPIRATION_IN_DAYS
  },

  //email
  email: {
    smtp: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      auth: {
        user: env.SMTP_USERNAME,
        pass: env.SMTP_PASSWORD
      }
    }
  }
};
