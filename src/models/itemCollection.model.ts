import logger from '@/lib/logger.js';
import { CoreServiceContext } from '@/types/index.js';
import { getErrorMessage } from '@/utils/error.util.js';
import { ApolloError } from 'apollo-server-errors';
import { ItemPayload } from './item.model.js';

export const generateItemCollectionModel = (context: CoreServiceContext) => {
  const { prisma } = context;

  return {
    /**
     * Collect (favorite) an item for a user
     * Uses transaction to atomically create collection record and increment counter
     * @param userId
     * @param itemId
     * @returns Updated Item object
     */
    collectItemForUser: async (userId: string, itemId: string): Promise<ItemPayload> => {
      try {
        return await prisma.$transaction(async (tx) => {
          // Create the collection record (will fail with unique constraint if already exists)
          await tx.itemCollection.create({
            data: {
              userId: userId,
              itemId: itemId,
            },
          });

          // Increment the collections counter
          const updatedItem = await tx.item.update({
            where: { id: itemId },
            data: {
              collectionsCount: {
                increment: 1,
              },
            },
            include: {
              seller: true,
              category: true,
              images: {
                orderBy: { sort: 'asc' },
              },
            },
          });

          return updatedItem;
        });
      } catch (error) {
        logger.error(`Item collection failed: ${getErrorMessage(error)}`);
        throw new ApolloError('Item collection failed');
      }
    },

    /**
     * Uncollect (unfavorite) an item for a user
     * Uses transaction to atomically delete collection record and decrement counter
     * @param userId
     * @param itemId
     * @returns Updated Item object
     */
    uncollectItemForUser: async (userId: string, itemId: string): Promise<ItemPayload> => {
      try {
        return await prisma.$transaction(async (tx) => {
          // Delete the collection record (will fail if doesn't exist)
          await tx.itemCollection.delete({
            where: {
              itemId_userId: {
                itemId: itemId,
                userId: userId,
              },
            },
          });

          // Decrement the collections counter
          const updatedItem = await tx.item.update({
            where: { id: itemId },
            data: {
              collectionsCount: {
                decrement: 1,
              },
            },
            include: {
              seller: true,
              category: true,
              images: {
                orderBy: { sort: 'asc' },
              },
            },
          });

          return updatedItem;
        });
      } catch (error) {
        logger.error(`Item uncollection failed: ${getErrorMessage(error)}`);
        throw new ApolloError('Item uncollection failed');
      }
    },

    /**
     * Check if multiple items are collected by a user
     * Designed for use with DataLoader to prevent N+1 queries
     * @param userId
     * @param itemIds Array of item IDs to check
     * @returns Array of booleans in same order as input itemIds
     */
    checkIfItemsAreCollected: async (userId: string, itemIds: string[]): Promise<boolean[]> => {
      // Single query to get all collection records for this user and these items
      const collections = await prisma.itemCollection.findMany({
        where: {
          userId: userId,
          itemId: {
            in: itemIds,
          },
        },
        select: {
          itemId: true,
        },
      });

      // Create a Set of collected item IDs for O(1) lookup
      const collectedItemIds = new Set(collections.map((c) => c.itemId));

      // Return boolean array in same order as input itemIds
      return itemIds.map((itemId) => collectedItemIds.has(itemId));
    },
  };
};
