import {
  ItemDetailCommentsArgs,
  ItemDetailResolvers,
  ItemListResolvers,
  QueryResolvers,
  MutationResolvers,
} from '@/graphql/generated/types.js';
import { MyContext } from '@/types/index.js';
import { ItemPayload } from '@/models/item.model.js';
import logger from '@/lib/logger.js';

const mutation: MutationResolvers<MyContext> = {
  createItem: async (_parent, { input }, context: MyContext) => {
    const { userId } = context;
    if (!userId) {
      return {
        success: false,
        message: 'Authentication required',
      };
    }

    try {
      await context.models.item.createItem(userId, input);
      return {
        success: true,
        message: 'Item created successfully',
      };
    } catch (error) {
      logger.error('Error creating item:', error);
      return {
        success: false,
        message: 'Failed to create item',
      };
    }
  },
};

const itemDetailResolver: ItemDetailResolvers<MyContext> = {
  // These fields match the DB, so no resolver is needed: id, title, description, condition, location

  price: (parent: ItemPayload) => {
    return parent.price.toNumber();
  },

  oldPrice: (parent: ItemPayload) => {
    if (!parent.oldPrice) return null;
    return parent.oldPrice.toNumber();
  },

  imageUrls: (parent: ItemPayload) => {
    return parent.images.map((image) => image.url);
  },

  seller: (parent: ItemPayload) => {
    return parent.seller;
  },

  category: (parent: ItemPayload) => {
    return parent.category;
  },

  comments: async (
    parent,
    { first, after }: Partial<ItemDetailCommentsArgs>,
    context: MyContext
  ) => {
    const connection = await context.models.comment.findCommentsByItemId(parent.id, {
      first: first || 10,
      after,
    });
    return {
      ...connection,
      edges: connection.edges.map((edge) => ({
        cursor: edge.cursor,
        node: {
          id: edge.node.id,
          content: edge.node.content,
          user: edge.node.author,
          children:
            edge.node.replies?.length > 0
              ? {
                  id: edge.node.replies[0].id,
                  content: edge.node.replies[0].content,
                  user: edge.node.replies[0].author,
                  children: null,
                }
              : null,
        },
      })),
    };
  },

  collectionsCount: (parent: ItemPayload) => {
    return parent.collectionsCount;
  },

  isCollectedByMe: async (parent: ItemPayload, _args, context: MyContext) => {
    if (!context.userId || !context.getItemCollectionLoader) {
      return false;
    }
    const loader = context.getItemCollectionLoader(context.userId);
    return await loader.load(parent.id);
  },
};

const query: QueryResolvers<MyContext> = {
  item: async (_parent, { id }, context: MyContext) => {
    const item = await context.models.item.findItemById(id);
    if (!item) {
      return null;
    }
    return item;
  },

  items: async (_parent, { first, after, filter }, context: MyContext) => {
    const connection = await context.models.item.findItemConnection({ first, after }, filter);
    return {
      ...connection,
      edges: connection.edges.map((edge) => ({
        cursor: edge.cursor,
        node: {
          id: edge.node.id,
          title: edge.node.title,
          description: edge.node.description || '',
          collectionsCount: edge.node.collectionsCount,
          price: edge.node.price.toNumber(),
          oldPrice: null,
          imageUrl: edge.node.images[0]?.url || '',
          seller: edge.node.seller,
          isCollectedByMe: false,
        },
      })),
    };
  },
};

const itemListResolver: ItemListResolvers<MyContext> = {
  isCollectedByMe: async (parent, _args, context: MyContext) => {
    if (!context.userId || !context.getItemCollectionLoader) {
      return false;
    }
    const loader = context.getItemCollectionLoader(context.userId);
    return await loader.load(parent.id);
  },
};

export const itemResolvers = {
  Mutation: mutation,
  Query: query,
  ItemDetail: itemDetailResolver,
  ItemList: itemListResolver,
};
