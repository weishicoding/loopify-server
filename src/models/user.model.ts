import { ModelContext, PrismaUser } from '@/types/index.js';

export const generateUserModel = (context: ModelContext) => {
  const { loaders } = context;

  return {
    /**
     * Get user by ID
     * @param id
     * @returns
     */
    getById: async (id: string | null): Promise<PrismaUser | null> => {
      if (id) {
        return loaders.user.load(id);
      }
      return null;
    }
  };
};
