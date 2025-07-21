import { CoreServiceContext } from '@/types/index.js';
import { Category as PrismaCategory } from '@prisma/client';
import DataLoader from 'dataloader';

const batchCategories = (context: CoreServiceContext) => {
  return async (parentIds: readonly string[]): Promise<PrismaCategory[][]> => {
    const children = await context.prisma.category.findMany({
      where: {
        parentId: {
          in: [...parentIds],
        },
      },
    });

    // We need to group the children by their parentId so DataLoader can map them correctly.
    const childrenMap = new Map<string, PrismaCategory[]>();
    children.forEach((child) => {
      if (!child.parentId) return;
      const parentChildren = childrenMap.get(child.parentId) || [];
      parentChildren.push(child);
      childrenMap.set(child.parentId, parentChildren);
    });

    // Map the results back to the original order of parentIds
    return parentIds.map((id) => childrenMap.get(id) || []);
  };
};

export const generateCategoryLoader = (context: CoreServiceContext) => {
  return new DataLoader<string, PrismaCategory[]>(batchCategories(context));
};
