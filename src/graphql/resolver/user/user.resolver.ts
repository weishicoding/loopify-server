import { MyContext, PrismaUser } from '@/types/index.js';
import { QueryResolvers, UserResolvers } from '../../generated/types.js';
import { validatePaginationArgs } from '@/utils/validation.util.js';

const query: QueryResolvers<MyContext> = {
  me: (_any, __any, context) => {
    return context.models.user.getById(context.userId);
  },
  user: (_any, { id }, context) => {
    return context.models.user.getById(id);
  },
};

const userTypeResolver: UserResolvers<MyContext> = {
  followers: async (parent: PrismaUser, args, context) => {
    validatePaginationArgs(args);

    const connection = await context.models.follow.getFollowersConnection(parent.id, args);

    return {
      ...connection,
      edges: connection.edges.map((edge) => ({
        cursor: edge.cursor,
        node: edge.node.follower,
      })),
    };
  },
  isFollowedByMe: async (parent: PrismaUser, _, context) => {
    if (!context.userId) {
      return false;
    }
    return await context.models.follow.isFollowedByUser(context.userId, parent.id);
  },
  followerCount: async (parent, _, context) => {
    return await context.models.follow.countFollowers(parent.id);
  },
  followingCount: async (parent, _, context) => {
    return await context.models.follow.countFollowings(parent.id);
  },
};
export const userResolver = {
  Query: query,
  User: userTypeResolver,
};
