import { authResolver } from './auth/auth.resolver.js';
import { categoryResolvers } from './item/category.resolver.js';
import { itemResolvers } from './item/item.resolver.js';
import { collectionResolver } from './item/collection.resolver.js';
import { commentResolvers } from './comment/comment.resolver.js';
import { messagingResolvers } from './messaging/messaging.resolver.js';
import { uploadResolver } from './upload/upload.resolver.js';
import { followResolver } from './user/follow.resolver.js';
import { userResolver } from './user/user.resolver.js';

export const resolvers = [
  userResolver,
  authResolver,
  followResolver,
  uploadResolver,
  categoryResolvers,
  itemResolvers,
  collectionResolver,
  commentResolvers,
  messagingResolvers,
];
