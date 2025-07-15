import { BEARER, BLACKLIST_KEY_JTI, VERTIFICATION_CODE } from '@/constant/index.js';
import logger from '@/lib/logger.js';
import sendVertificationCode from '@/lib/mailer.js';
import { BaseContext } from '@/types/index.js';
import crypto from 'crypto';
import { ApolloError, ForbiddenError, UserInputError } from 'apollo-server-errors';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth.helper.js';
import dayjs from 'dayjs';
import { decode } from 'jsonwebtoken';
import { AuthPayload, GenericResponse } from '@/graphql/generated/types.js';
import { getErrorMessage } from '@/utils/error.util.js';

export const generateAuthModel = (context: BaseContext) => {
  const { prisma, redis } = context;
  return {
    /**
     * Send an email verify code to users
     * @param email
     * @returns
     */
    async sendEmailCode(email: string): Promise<GenericResponse> {
      try {
        const code = crypto.randomInt(100000, 1000000).toString();
        const redisKey = `${VERTIFICATION_CODE}:${email}`;
        await redis.set(redisKey, code, 'EX', 300);
        await sendVertificationCode(email, code);

        return {
          success: true,
          message: 'Verification code sent.',
        };
      } catch (error) {
        logger.error(`Failed to send verification code: ${getErrorMessage(error)}`);
        throw new ApolloError('Failed to send verification code');
      }
    },

    /**
     * Login with email and verification code
     * @param email
     * @param code
     * @returns
     */
    async loginWithCode(email: string, code: string): Promise<AuthPayload> {
      const redisKey = `${VERTIFICATION_CODE}:${email}`;
      const storedCode = await redis.get(redisKey);
      if (!storedCode || storedCode !== code) {
        logger.warn('The verification code is incorrect or has expired.');
        throw new UserInputError('The verification code is incorrect or has expired.');
      }
      try {
        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          user = await prisma.user.create({ data: { email, name: email.split('@')[0] } });
        }

        await redis.del(redisKey);

        const accessToken = generateAccessToken({ userId: user.id });
        const refreshToken = await generateRefreshToken(user.id);

        return { accessToken, refreshToken, userId: user.id };
      } catch (error: unknown) {
        logger.error(`Login with code failed for email ${email}:`, getErrorMessage(error));
        throw new ApolloError(`Login with code failed`);
      }
    },

    /**
     * Refresh access token using refresh token
     * @param refreshToken
     * @returns
     */
    async refreshToken(refreshToken: string): Promise<AuthPayload> {
      try {
        const token = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
        if (!token || token.revoked || dayjs().isAfter(token.expireAt)) {
          logger.warn('Invalid or expired refresh token');
          throw new UserInputError('Invalid or expired refresh token');
        }

        const newAccessToken = generateAccessToken({ userId: token.userId });
        console.log(token.userId);

        return { accessToken: newAccessToken, refreshToken, userId: token.userId };
      } catch (error: unknown) {
        logger.error(`Refresh token failed: ${getErrorMessage(error)}`);
        throw new ApolloError('Refresh token failed');
      }
    },

    async logout(refreshToken: string): Promise<GenericResponse> {
      const { prisma, redis, userId, req } = context;

      // 1. Revoke refresh token
      if (!userId) {
        throw new ForbiddenError('Not authenticated');
      }

      const updateResult = await prisma.refreshToken.updateMany({
        where: { userId: userId, revoked: false, token: refreshToken },
        data: {
          revoked: true,
        },
      });

      if (updateResult.count === 0) {
        throw new ApolloError('Invalid or already revoked refresh token.');
      }

      // 2. Add access token to blacklist
      const authHeader = req?.headers.authorization;
      if (authHeader && authHeader.startsWith(BEARER)) {
        const accessToken = authHeader.replace(BEARER, '');

        try {
          const decodeToken = decode(accessToken) as { jti: string; exp: number };
          if (decodeToken && decodeToken.jti && decodeToken.exp) {
            const jti = decodeToken.jti;
            const expireAt = decodeToken.exp;
            const now = Math.floor(Date.now() / 1000);
            const ttl = expireAt - now;

            if (ttl > 0) {
              await redis.set(`${BLACKLIST_KEY_JTI}:${jti}`, 'revoke', 'EX', ttl);
              logger.info(`Access token JTI ${jti} blacklisted for ${ttl} seconds.`);
            }
          }
        } catch (error) {
          logger.error('Failed to blacklist access token on logout:', getErrorMessage(error));
        }
      }
      return { success: true, message: 'User login out successfully' };
    },
  };
};
