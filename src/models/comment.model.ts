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
  };
};
