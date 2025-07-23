import { MutationResolvers, QueryResolvers } from '@/graphql/generated/types.js';
import { MyContext } from '@/types/index.js';

const mutation: MutationResolvers<MyContext> = {};

const query: QueryResolvers<MyContext> = {};

export const itemResolvers = {
  Mutation: mutation,
  Query: query,
};
