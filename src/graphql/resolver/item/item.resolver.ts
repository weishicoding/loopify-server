import { MutationResolvers, QueryResolvers } from '@/graphql/generated/types.js';
import { MyContext } from '@/types/index.js';

const mutation: MutationResolvers<MyContext> = {};

const query: QueryResolvers<MyContext> = {
  categories: (_parent, { id }, context) => {},
};
export const itemResolvers = {
  Mutation: mutation,
  Query: query,
};
