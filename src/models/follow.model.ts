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
      const { first, after } = paginationArgs;
      const whereCondition = {
        followingId: userId,
      };

      const records = await prisma.follow.findMany({
        take: first + 1,
        cursor: after ? { id: after } : undefined,
        skip: after ? 1 : 0,
        where: whereCondition,
        include: {
          follower: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const totalCount = await prisma.follow.count({
        where: whereCondition,
      });

      const hasNextPage = records.length > first;
      if (hasNextPage) records.pop();

      const edges = records.map((record) => ({
        cursor: record.id,
        node: record,
      }));

      const endCursor = edges.length > 0 ? edges[edges.length - 1].cursor : null;

      return {
        totalCount,
        pageInfo: {
          hasNextPage,
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
      const { first, after } = paginationArgs;
      const whereCondition = {
        followerId: userId,
      };

      const records = await prisma.follow.findMany({
        take: first + 1,
        cursor: after ? { id: after } : undefined,
        skip: after ? 1 : 0,
        where: whereCondition,
        include: {
          following: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const totalCount = await prisma.follow.count({
        where: whereCondition,
      });

      const hasNextPage = records.length > first;
      if (hasNextPage) records.pop();

      const edges = records.map((record) => ({
        cursor: record.id,
        node: record,
      }));

      const endCursor = edges.length > 0 ? edges[edges.length - 1].cursor : null;

      return {
        totalCount,
        pageInfo: {
          hasNextPage,
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
