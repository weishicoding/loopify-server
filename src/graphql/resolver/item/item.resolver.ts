import { MutationResolvers, QueryResolvers } from '@/graphql/generated/types.js';
import { MyContext } from '@/types/index.js';

const mutation: MutationResolvers<MyContext> = {};

const query: QueryResolvers<MyContext> = {
  //   item: (_parent, { id }, context)=> {

  //     return context.models.item.findItemById(id);
  //   },
  items: async (_parent, { first, after, filter }, context) => {
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
};
