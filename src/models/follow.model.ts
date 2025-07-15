import { GenericResponse } from '@/graphql/generated/types.js';
import logger from '@/lib/logger.js';
import { ConnectionArguments, CoreServiceContext, PaginationConnection } from '@/types/index.js';
import { getErrorMessage } from '@/utils/error.util.js';
import { Prisma } from '@prisma/client';
import { ApolloError } from 'apollo-server-errors';

type FollowWithFollower = Prisma.FollowGetPayload<{
  include: { follower: true };
}>;

type FollowWithFollowing = Prisma.FollowGetPayload<{
  include: { following: true };
}>;

export const generateFollowModel = (context: CoreServiceContext) => {
  const { prisma } = context;

  return {
    /**
     * Get all followers by userId
     * @param userId
     * @param paginationArgs
     * @returns
     */
    getFollowersConnection: async (
      userId: string,
      paginationArgs: ConnectionArguments
    ): Promise<PaginationConnection<FollowWithFollower>> => {
      const { first, after, last, before } = paginationArgs;
      const take = first ? first + 1 : last ? -(last + 1) : undefined;
      const cursor = first ? after : before;

      const isForward = typeof first === 'number';
      const isBackward = typeof last === 'number';

      const records = await prisma.follow.findMany({
        take,
        cursor: cursor ? { id: cursor } : undefined,
        skip: cursor ? 1 : 0,
        where: {
          followerId: userId,
        },
        include: {
          follower: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const totalCount = await prisma.follow.count({
        where: { followerId: userId },
      });

      let hasNextPage = false;
      let hasPreviousPage = false;

      if (isForward) {
        hasNextPage = records.length > first;
        if (hasNextPage) records.pop();
      } else if (isBackward) {
        hasPreviousPage = records.length > last;
        if (hasPreviousPage) records.shift();
        records.reverse();
      }

      const edges = records.map((record) => ({
        cursor: record.id,
        node: record,
      }));

      const startCursor = edges.length > 0 ? edges[0].cursor : null;
      const endCursor = edges.length > 0 ? edges[edges.length - 1].cursor : null;

      if (isForward && after) {
        hasNextPage = true;
      }

      if (isBackward && before) {
        hasPreviousPage = true;
      }

      return {
        totalCount,
        pageInfo: {
          hasNextPage,
          hasPreviousPage,
          startCursor,
          endCursor,
        },
        edges,
      };
    },
    /**
     * Get all following by userId
     * @param userId
     * @param paginationArgs
     * @returns
     */
    getFollowingConnection: async (
      userId: string,
      paginationArgs: ConnectionArguments
    ): Promise<PaginationConnection<FollowWithFollowing>> => {
      const { first, after, last, before } = paginationArgs;
      const take = first ? first + 1 : last ? -(last + 1) : undefined;
      const cursor = first ? after : before;

      const isForward = typeof first === 'number';
      const isBackward = typeof last === 'number';

      const records = await prisma.follow.findMany({
        take,
        cursor: cursor ? { id: cursor } : undefined,
        skip: cursor ? 1 : 0,
        where: {
          followingId: userId,
        },
        include: {
          following: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const totalCount = await prisma.follow.count({
        where: { followingId: userId },
      });

      let hasNextPage = false;
      let hasPreviousPage = false;

      if (isForward) {
        hasNextPage = records.length > first;
        if (hasNextPage) records.pop();
      } else if (isBackward) {
        hasPreviousPage = records.length > last;
        if (hasPreviousPage) records.shift();
        records.reverse();
      }

      const edges = records.map((record) => ({
        cursor: record.id,
        node: record,
      }));

      const startCursor = edges.length > 0 ? edges[0].cursor : null;
      const endCursor = edges.length > 0 ? edges[edges.length - 1].cursor : null;

      if (isForward && after) {
        hasNextPage = true;
      }

      if (isBackward && before) {
        hasPreviousPage = true;
      }

      return {
        totalCount,
        pageInfo: {
          hasNextPage,
          hasPreviousPage,
          startCursor,
          endCursor,
        },
        edges,
      };
    },
    followUser: async (followerId: string, followingId: string): Promise<GenericResponse> => {
      try {
        const follow = await prisma.follow.findMany({
          where: {
            followerId: followerId,
            followingId: followingId,
          },
        });
        if (follow.length > 0) {
          return { success: false, message: 'User can not follow same user ' };
        }
        await prisma.follow.create({
          data: {
            followerId: followerId,
            followingId: followingId,
          },
        });
        return { success: true, message: 'User follow successfully' };
      } catch (error) {
        logger.error(`User follow fialed: ${getErrorMessage(error)}`);
        throw new ApolloError('User follow fialed');
      }
    },
    unfollowUser: async (followerId: string, followingId: string): Promise<GenericResponse> => {
      try {
        await prisma.follow.deleteMany({
          where: {
            followerId: followerId,
            followingId: followingId,
          },
        });
        return { success: true, message: 'User unfollow successfully' };
      } catch (error) {
        logger.error(`User unfollow fialed: ${getErrorMessage(error)}`);
        throw new ApolloError('User unfollow fialed');
      }
    },
    countFollowers: async (userId: string): Promise<number> => {
      return await prisma.follow.count({
        where: {
          followingId: userId,
        },
      });
    },
    countFollowings: async (userId: string): Promise<number> => {
      return await prisma.follow.count({
        where: {
          followerId: userId,
        },
      });
    },
    isFollowedByUser: async (followerId: string, followingId: string): Promise<boolean> => {
      const result = await prisma.follow.findUnique({
        where: {
          unique_follow: {
            followerId: followerId,
            followingId: followingId,
          },
        },
      });
      return result ? true : false;
    },
  };
};
