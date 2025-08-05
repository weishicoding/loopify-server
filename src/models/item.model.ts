import { ItemsFilterInput } from '@/graphql/generated/types.js';
import { ConnectionArguments, CoreServiceContext } from '@/types/index.js';
import { Prisma } from '@prisma/client';

export type ItemPayload = Prisma.ItemGetPayload<{
  include: {
    seller: true;
    category: true;
    images: {
      orderBy: { sort: 'asc' };
    };
  };
}>;

export const generateItemModels = (context: CoreServiceContext) => {
  const { prisma } = context;
  return {
    findItemById: async (id: string): Promise<ItemPayload | null> => {
      return await prisma.item.findUnique({
        where: { id },
        include: {
          seller: true,
          category: true,
          images: {
            orderBy: { sort: 'asc' },
          },
        },
      });
    },
    findItemConnection: async (
      paginationArgs: ConnectionArguments,
      filter?: ItemsFilterInput | null
    ) => {
      const { first, after } = paginationArgs;

      const where: Prisma.ItemWhereInput = {
        status: 'AVAILABLE',
      };

      if (filter) {
        if (filter.categoryId) {
          where.categoryId = filter.categoryId;
        }
        if (filter.sellerId) {
          where.sellerId = filter.sellerId;
        }
        if (filter.condition) {
          where.condition = filter.condition;
        }
        if (filter.searchTerm) {
          // Basic search on title and description.
          where.OR = [
            { title: { contains: filter.searchTerm, mode: 'insensitive' } },
            { description: { contains: filter.searchTerm, mode: 'insensitive' } },
          ];
        }
      }

      const [records, totalCount] = await prisma.$transaction([
        prisma.item.findMany({
          take: first + 1,
          cursor: after ? { id: after } : undefined,
          skip: after ? 1 : 0,
          where,

          include: {
            seller: true,
            images: {
              where: { sort: 0 },
              take: 1,
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.item.count({ where }),
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
