import { ItemsFilterInput } from '@/graphql/generated/types.js';
import { ConnectionArguments, CoreServiceContext } from '@/types/index.js';

export const generateItemModels = (context: CoreServiceContext) => {
  const { prisma } = context;
  return {
    findItemById: async (id: string) => {
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
      return null;
    },
  };
};
