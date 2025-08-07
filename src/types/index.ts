import { generateCategoryLoader } from '@/loaders/category.loader.js';
import { generateUserLoader } from '@/loaders/user.loader.js';
import { generateAuthModel } from '@/models/auth.model.js';
import { generateCategoryModel } from '@/models/category.model.js';
import { generateFollowModel } from '@/models/follow.model.js';
import { generateItemModels } from '@/models/item.model.js';
import { generateUserModel } from '@/models/user.model.js';
import { generateCommentModel } from '@/models/comment.model.js';
import { generateItemCollectionModel } from '@/models/itemCollection.model.js';
import { generateMessagingModel } from '@/models/messaging.model.js';
import { generateItemCollectionLoader } from '@/loaders/itemCollection.loader.js';
import { PrismaClient, User as PrismaUser } from '@prisma/client';
import { Request } from 'express';
import { Redis } from 'ioredis';

/**
 * This contains some singleton services that are able to pass to different base layer
 */
export interface CoreServiceContext {
  prisma: PrismaClient;
  redis: Redis;
}

/**
 * This is some status about the whole retquest lifecycle of graphql
 */
export interface RequestContext {
  userId: string | null;
  req?: Request;
}

/**
 * This context provides both core services and request information
 */
export type BaseContext = CoreServiceContext & RequestContext;

/**
 * DataLoaders
 */
export interface MyLoaders {
  user: ReturnType<typeof generateUserLoader>;
  category: ReturnType<typeof generateCategoryLoader>;
}

/**
 * Business layer of application
 */
export interface MyModels {
  auth: ReturnType<typeof generateAuthModel>;
  user: ReturnType<typeof generateUserModel>;
  follow: ReturnType<typeof generateFollowModel>;
  category: ReturnType<typeof generateCategoryModel>;
  item: ReturnType<typeof generateItemModels>;
  comment: ReturnType<typeof generateCommentModel>;
  itemCollection: ReturnType<typeof generateItemCollectionModel>;
  messaging: ReturnType<typeof generateMessagingModel>;
}

/**
 * This contains core services and context of dataload that are able to pass it to the model layer
 */
export interface ModelContext extends BaseContext {
  loaders: MyLoaders;
}

/**
 * This is the final GraphQL context
 * It can be used in resolver as context
 * It contains all of things that are core service, dataloader context and business layer models
 */
export interface MyContext extends ModelContext {
  models: MyModels;
  getItemCollectionLoader?: (userId: string) => ReturnType<typeof generateItemCollectionLoader>;
}

/**
 * export Prisma/client Objects
 */
export type { PrismaUser };

/**
 * This is pagination arguments for all pagination connections
 */
export interface ConnectionArguments {
  readonly first: number;
  readonly after?: string | null;
  readonly filter?: unknown;
}

/**
 * Connection generic return for pagination
 */
export interface PaginationConnection<T> {
  edges: {
    cursor: string;
    node: T;
  }[];
  pageInfo: {
    endCursor: string | null;
    hasNextPage: boolean;
  };
  totalCount: number;
}

export enum TokenType {
  ACCESS,
  REFRESH,
}
