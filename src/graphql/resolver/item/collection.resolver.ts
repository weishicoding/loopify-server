import { MyContext } from '@/types/index.js';
import { MutationResolvers } from '../../generated/types.js';
import { ApolloError, AuthenticationError } from 'apollo-server-errors';

const mutation: MutationResolvers<MyContext> = {
  collectItem: async (_parent, { itemId }, context) => {
    if (!context.userId) {
      throw new AuthenticationError('Authentication required');
    }

    try {
      return await context.models.itemCollection.collectItemForUser(context.userId, itemId);
    } catch (error) {
      // Handle unique constraint error (user already collected this item)
      if (error instanceof Error && error.message.includes('unique constraint')) {
        throw new ApolloError('Item is already collected by this user');
      }
      throw error;
    }
  },

  uncollectItem: async (_parent, { itemId }, context) => {
    if (!context.userId) {
      throw new AuthenticationError('Authentication required');
    }

    return await context.models.itemCollection.uncollectItemForUser(context.userId, itemId);
  },
};

export const collectionResolver = {
  Mutation: mutation,
};
