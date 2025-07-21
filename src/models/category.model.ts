import { CoreServiceContext } from '@/types/index.js';
import { Category as PrismaCategory } from '@prisma/client';

export const generateCategoryModel = (context: CoreServiceContext) => {
  const { prisma } = context;
  return {
    /**
     * Fetches all categories that do not have a parent.
     * @returns
     */
    findTopLevelCategories: async (): Promise<PrismaCategory[]> => {
      return await prisma.category.findMany({
        where: { parentId: null },
      });
    },

    /**
     * Fetches a single category by its ID.
     * @param id
     * @returns
     */
    findCategoryById: async (id: string): Promise<PrismaCategory | null> => {
      return await prisma.category.findUnique({
        where: { id },
      });
    },
  };
};
