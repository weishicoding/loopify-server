import { ConnectionArguments, CoreServiceContext } from '@/types/index.js';
import { Prisma } from '@prisma/client';

export const generateCommentModel = (context: CoreServiceContext) => {
  const { prisma } = context;
  return {
    findCommentsByItemId: async (itemId: string, paginationArgs: ConnectionArguments) => {
      const { first, after } = paginationArgs;

      const where: Prisma.CommentWhereInput = {
        itemId,
        parentId: null, // Only get top-level comments
      };

      const [records, totalCount] = await prisma.$transaction([
        prisma.comment.findMany({
          take: first + 1,
          cursor: after ? { id: after } : undefined,
          skip: after ? 1 : 0,
          where,
          include: {
            author: true,
            replies: {
              include: {
                author: true,
              },
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.comment.count({ where }),
      ]);

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

    createComment: async (authorId: string, itemId: string, content: string, parentId?: string) => {
      return await prisma.comment.create({
        data: {
          content,
          authorId,
          itemId,
          parentId,
        },
        include: {
          author: true,
        },
      });
    },

    likeComment: async (userId: string, commentId: string) => {
      return await prisma.$transaction(async (tx) => {
        // Check if already liked
        const existingLike = await tx.commentLike.findUnique({
          where: {
            userId_commentId: {
              userId,
              commentId,
            },
          },
        });

        if (existingLike) {
          throw new Error('Comment already liked');
        }

        // Create the like
        await tx.commentLike.create({
          data: {
            userId,
            commentId,
          },
        });

        // Increment the like count
        await tx.comment.update({
          where: { id: commentId },
          data: {
            likedCount: {
              increment: 1,
            },
          },
        });
      });
    },

    unlikeComment: async (userId: string, commentId: string) => {
      return await prisma.$transaction(async (tx) => {
        // Check if like exists
        const existingLike = await tx.commentLike.findUnique({
          where: {
            userId_commentId: {
              userId,
              commentId,
            },
          },
        });

        if (!existingLike) {
          throw new Error('Comment not liked');
        }

        // Delete the like
        await tx.commentLike.delete({
          where: {
            userId_commentId: {
              userId,
              commentId,
            },
          },
        });

        // Decrement the like count
        await tx.comment.update({
          where: { id: commentId },
          data: {
            likedCount: {
              decrement: 1,
            },
          },
        });
      });
    },
  };
};
