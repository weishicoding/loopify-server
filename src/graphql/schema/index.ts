import { gql } from 'graphql-tag';
import { userTypeDefs } from './user/user.schema.js';
import { directiveTypeDefs } from './directives.js';
import { authTypeDefs } from './auth/auth.schema.js';
import { commonTypeDefs } from './common.schema.js';
import { followTypeDefs } from './user/follow.schema.js';
import { uploadTypeDefs } from './upload/upload.schema.js';
import { categoryTypeDefs } from './item/category.schema.js';
import { itemTypeDefs } from './item/item.schema.js';

const baseTypeDefs = gql`
  type Query {
    _empty: String
  }
  type Mutation {
    _empty: String
  }
`;

export const typeDefs = [
  baseTypeDefs,
  commonTypeDefs,
  userTypeDefs,
  directiveTypeDefs,
  authTypeDefs,
  followTypeDefs,
  uploadTypeDefs,
  categoryTypeDefs,
  itemTypeDefs,
];
