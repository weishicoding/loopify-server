import {
  CategoriesResolvers,
  MutationResolvers,
  QueryResolvers,
} from '@/graphql/generated/types.js';
import { MyContext } from '@/types/index.js';
import { validateInput } from '@/utils/validation.util.js';
import categoryValidation from '@/validations/category.validation.js';

const mutation: MutationResolvers<MyContext> = {};

const query: QueryResolvers<MyContext> = {
  topLevelCategories: (_parent, _any, context) => {
    return context.models.category.findTopLevelCategories();
  },
  categories: async (_parent, args, context) => {
    const { id } = validateInput(categoryValidation.categoryQuerySchema, args);
    return await context.models.category.findCategoryById(id);
  },
};
const categoryTypeResolver: CategoriesResolvers<MyContext> = {
  children: (parent, _args, context) => {
    return context.loaders.category.load(parent.id);
  },
};
export const categoryResolvers = {
  Mutation: mutation,
  Query: query,
  Categories: categoryTypeResolver,
};
