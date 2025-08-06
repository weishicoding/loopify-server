import { MyContext } from '@/types/index.js';
import DataLoader from 'dataloader';

const batchItemCollections = (context: MyContext, userId: string) => {
  return async (itemIds: readonly string[]): Promise<boolean[]> => {
    return await context.models.itemCollection.checkIfItemsAreCollected(userId, [...itemIds]);
  };
};

export const generateItemCollectionLoader = (context: MyContext, userId: string) => {
  return new DataLoader<string, boolean>(batchItemCollections(context, userId));
};