import {
  ItemDetailCommentsArgs,
  ItemDetailResolvers,
  QueryResolvers,
} from '@/graphql/generated/types.js';
import { MyContext } from '@/types/index.js';

const mutation = {};

const itemDetail: ItemDetailResolvers<MyContext> = {
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
  seller: async (parent, _args, context: MyContext) => {
    const item = await context.models.item.findItemById(parent.id);
    if (!item?.seller) {
      throw new Error('Item or seller not found');
    }
    return item.seller;
  },
};

const query: QueryResolvers<MyContext> = {
  item: async (_parent, { id }: { id: string }, context: MyContext) => {
    const item = await context.models.item.findItemById(id);
    if (!item) {
      throw new Error('Item not found');
    }

    // Return the base object - the comments and seller fields will be resolved by ItemDetail resolvers
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return {
      id: item.id,
      title: item.title,
      description: item.description || '',
      price: item.price.toNumber(),
      oldPrice: null,
      imageUrls: item.images.map((img) => img.url),
      condition: item.condition || null,
      location: item.location,
      category: item.category,
    } as any;
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
  ItemDetail: itemDetail,
};
