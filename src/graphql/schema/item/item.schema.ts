import { gql } from 'graphql-tag';

export const itemTypeDefs = gql`
  type Categories {
    id: ID!
    name: String!
    children: [Categories]!
  }

  extend type Query {
    categories(id: ID): Categories!
  }
`;
