import {
  ItemDetailCommentsArgs,
  ItemDetailResolvers,
  ItemListResolvers,
  QueryResolvers,
  MutationResolvers,
} from '@/graphql/generated/types.js';
import { MyContext } from '@/types/index.js';
import { ItemListPayload, ItemPayload } from '@/models/item.model.js';
import { validateInput } from '@/utils/validation.util.js';
import itemValidation from '@/validations/item.validation.js';
import logger from '@/lib/logger.js';

const mutation: MutationResolvers<MyContext> = {
  createItem: async (_parent, args, context: MyContext) => {
    validateInput(itemValidation.createItemSchema, args);
    const { userId } = context;
    if (!userId) {
      return {
        success: false,
        message: 'Authentication required',
      };
    }

    try {
      await context.models.item.createItem(userId, args.input);
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
  item: async (_parent, args, context: MyContext) => {
    const { id } = validateInput(itemValidation.itemQuerySchema, args);
    const item = await context.models.item.findItemById(id);
    if (!item) {
      return null;
    }
    return item;
  },

  items: async (_parent, args, context: MyContext) => {
    const { first, after } = args; // Pagination args excluded from validation
    validateInput(itemValidation.itemsQuerySchema, args);
    const connection = await context.models.item.findItemConnection({ first, after }, args.filter);
    // Type assertion needed because GraphQL expects ItemList fields to be resolved by field resolvers
    return connection;
  },
};

const itemListResolver: ItemListResolvers<MyContext> = {
  price: (parent: ItemListPayload) => {
    return parent.price.toNumber();
  },

  oldPrice: (parent: ItemListPayload) => {
    if (!parent.oldPrice) return null;
    return parent.oldPrice.toNumber();
  },

  imageUrl: (parent: ItemListPayload) => {
    return parent.images[0]?.url;
  },

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
