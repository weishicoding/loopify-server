import { CoreServiceContext, PrismaUser } from '@/types/index.js';
import DataLoader from 'dataloader';

const batchUsers = (context: CoreServiceContext) => {
  return async (ids: readonly string[]): Promise<(PrismaUser | null)[]> => {
    const users = await context.prisma.user.findMany({
      where: {
        id: {
          in: [...ids],
        },
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));
    return ids.map((id) => userMap.get(id) || null);
  };
};

export const generateUserLoader = (context: CoreServiceContext) => {
  return new DataLoader<string, PrismaUser | null>(batchUsers(context));
};
