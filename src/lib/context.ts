import {
  BaseContext,
  CoreServiceContext,
  ModelContext,
  MyContext,
  MyLoaders,
  MyModels,
  RequestContext,
} from '@/types/index.js';
import { Request } from 'express';
import { verifyToken } from './auth.helper.js';
import logger from './logger.js';
import { prisma } from './prisma.js';
import { redis } from './redis.js';
import { BEARER } from '@/constant/index.js';
import { generateUserModel } from '@/models/user.model.js';
import { generateAuthModel } from '@/models/auth.model.js';
import { generateUserLoader } from '@/loaders/user.loader.js';
import { generateFollowModel } from '@/models/follow.model.js';
import { generateCategoryLoader } from '@/loaders/category.loader.js';
import { generateCategoryModel } from '@/models/category.model.js';
import { generateItemModels } from '@/models/item.model.js';
import { generateCommentModel } from '@/models/comment.model.js';
import { generateItemCollectionModel } from '@/models/itemCollection.model.js';
import { generateMessagingModel } from '@/models/messaging.model.js';
import { generateItemCollectionLoader } from '@/loaders/itemCollection.loader.js';

/**
 * Creates a context for the application as a global context
 *
 * @param req - The incoming request object containing headers.
 * @returns A context object containing Prisma client, Redis client, and user ID.
 */
// eslint-disable-next-line @typescript-eslint/require-await
export const context = async ({ req }: { req: Request }): Promise<MyContext> => {
  const authHeader = req.headers.authorization;

  let userId: string | null = null;

  if (authHeader && authHeader.startsWith(BEARER)) {
    const token = authHeader.replace(BEARER, '');
    try {
      const payload = verifyToken(token);
      userId = payload?.userId || null;
    } catch (error) {
      logger.warn(
        `Invalid or expired token recieved, ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  // The core services
  const coreServiceContext: CoreServiceContext = { prisma, redis };

  // Request context is different for different users
  const requestContext: RequestContext = { userId, req };

  // BaseContext contains core services and request informations
  const baseContext: BaseContext = { ...coreServiceContext, ...requestContext };

  const loaders: MyLoaders = {
    user: generateUserLoader(baseContext),
    category: generateCategoryLoader(baseContext),
  };

  const modelContet: ModelContext = {
    ...baseContext,
    loaders,
  };

  const models: MyModels = {
    user: generateUserModel(modelContet),
    auth: generateAuthModel(modelContet),
    follow: generateFollowModel(modelContet),
    category: generateCategoryModel(modelContet),
    item: generateItemModels(modelContet),
    comment: generateCommentModel(modelContet),
    itemCollection: generateItemCollectionModel(modelContet),
    messaging: generateMessagingModel(baseContext),
  };

  const context: MyContext = {
    ...modelContet,
    models,
  };

  // Add helper method to create item collection loader
  const collectionLoaderCache = new Map<string, ReturnType<typeof generateItemCollectionLoader>>();

  context.getItemCollectionLoader = (userId: string) => {
    if (!collectionLoaderCache.has(userId)) {
      collectionLoaderCache.set(userId, generateItemCollectionLoader(context, userId));
    }
    return collectionLoaderCache.get(userId)!;
  };

  return context;
};
