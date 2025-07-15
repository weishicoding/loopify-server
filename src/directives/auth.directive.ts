import { BaseContext } from '@/types/index.js';
import { getDirective, mapSchema } from '@graphql-tools/utils';
import { defaultFieldResolver, GraphQLSchema } from 'graphql';
import { AuthenticationError } from 'apollo-server-errors';
import { decode } from 'jsonwebtoken';
import { BEARER, BLACKLIST_KEY_JTI } from '@/constant/index.js';
import logger from '@/lib/logger.js';

/**
 * Auth directive for GraphQL schema.
 * This directive checks if the user is authenticated before resolving the field.
 *
 * @param schema - The GraphQL schema to apply the directive to.
 * @param directiveName - The name of the directive to check for (e.g., 'auth').
 * @returns A new schema with the auth directive applied to fields.
 */
export const authDirective = (schema: GraphQLSchema, directiveName: string) => {
  return mapSchema(schema, {
    ['MapperKind.OBJECT_FIELD']: (fieldConfig) => {
      const authDirective = getDirective(schema, fieldConfig, directiveName)?.[0];
      if (authDirective) {
        const { resolve = defaultFieldResolver } = fieldConfig;
        fieldConfig.resolve = async function (source, args, context: BaseContext, info) {
          // Fistly, if user is not authenticated, throw an error
          if (!context.userId) {
            throw new AuthenticationError('User is not authenticated');
          }

          // Second, check if the access token is in blacklist
          const { redis, req } = context;
          const authHeader = req?.headers.authorization;
          if (authHeader && authHeader.startsWith(BEARER)) {
            const accessToken = authHeader.replace(BEARER, '');
            const decodedToken = decode(accessToken) as { jti: string };
            if (decodedToken && decodedToken.jti) {
              const isBlacklisted = await redis.get(`${BLACKLIST_KEY_JTI}:${decodedToken.jti}`);
              if (isBlacklisted) {
                // If access token exist inside blaclist, it means that user has logouted
                logger.error(`Token has beed revoked. JTI: ${decodedToken.jti}`);
                throw new AuthenticationError('Token has been revoked.');
              }
            }
          }

          return resolve(source, args, context, info);
        };
        return fieldConfig;
      }
    }
  });
};
