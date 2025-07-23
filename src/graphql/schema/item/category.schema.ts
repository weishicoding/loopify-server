import { gql } from 'graphql-tag';

export const categoryTypeDefs = gql`
  type Categories {
    id: ID!
    name: String!
    children: [Categories]
  }

  extend type Query {
    topLevelCategories: [Categories]!
    categories(id: ID!): Categories
  }
`;
