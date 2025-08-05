import {
  ItemDetailCommentsArgs,
  ItemDetailResolvers,
  QueryResolvers,
} from '@/graphql/generated/types.js';
import { MyContext } from '@/types/index.js';
import { ItemPayload } from '@/models/item.model.js';

const mutation = {};

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
};

const query: QueryResolvers<MyContext> = {
  item: async (_parent, { id }, context: MyContext): Promise<ItemPayload | null> => {
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
          price: edge.node.price.toNumber(),
          oldPrice: null,
          imageUrl: edge.node.images[0]?.url || '',
          seller: edge.node.seller,
        },
      })),
    };
  },
};

export const itemResolvers = {
  Mutation: mutation,
  Query: query,
  ItemDetail: itemDetailResolver,
};
