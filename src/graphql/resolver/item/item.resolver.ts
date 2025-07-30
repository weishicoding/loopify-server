import { MutationResolvers, QueryResolvers } from '@/graphql/generated/types.js';
import { MyContext } from '@/types/index.js';

const mutation: MutationResolvers<MyContext> = {};

const query: QueryResolvers<MyContext> = {
  item: (_parent, { id }, context) => {
    return context.models.item.findItemById(id);
  },
  items: (_parent, { first, after, filter }, context) => {
    return context.models.item.findItemConnection({ first, after }, filter);
  },
};

export const itemResolvers = {
  Mutation: mutation,
  Query: query,
};
