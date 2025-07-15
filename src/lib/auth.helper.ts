import jwt from 'jsonwebtoken';
import config from '@/config/env.js';
import dayjs from 'dayjs';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma.js';
import { v4 as uuidv4 } from 'uuid';
import { TokenType } from '@/types/index.js';

interface UserPayload {
  userId: string;
}

/**
 * Generates a JWT access token for a user.
 * The token includes the user ID and is signed with a secret key.
 * The token expires after a specified duration defined in the configuration.
 * @param payload  - The payload to include in the JWT token, typically containing user information.
 * @param payload.userId - The ID of the user for whom the token is being generated
 * @returns
 */
export const generateAccessToken = (payload: { userId: string }): string => {
  return jwt.sign({ ...payload, type: TokenType.ACCESS }, config.jwt.secret, {
    expiresIn: `${config.jwt.accessExpirationInMinutes}m`,
    jwtid: uuidv4()
  });
};

/**
 * Generates a refresh token for a user.
 * The refresh token is a random string that is stored in the database with an expiration date
 * The expiration date is set to a specified number of days defined in the configuration.
 * @param userId  - The ID of the user for whom the refresh token is being generated.
 * @returns
 */
export const generateRefreshToken = async (userId: string): Promise<string> => {
  const token = crypto.randomBytes(64).toString('hex');
  const expireAt = dayjs().add(config.jwt.refreshExpirationInDays, 'days').toDate();

  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expireAt
    }
  });
  return token;
};

/**
 * Verifies a JWT token and returns the decoded payload.
 * If the token is invalid or expired, it returns null.
 * @param token - The JWT token to verify.
 * @returns The decoded user payload if the token is valid, otherwise null.
 */
export const verifyToken = (token: string): UserPayload | null => {
  return jwt.verify(token, config.jwt.secret) as UserPayload;
};
