import { gql } from 'graphql-tag';

export const collectionTypeDefs = gql`
  extend type Mutation {
    "Adds an item to the current user's collection"
    collectItem(itemId: ID!): ItemDetail! @auth
    "Removes an item from the current user's collection"
    uncollectItem(itemId: ID!): ItemDetail! @auth
  }

  extend type ItemDetail {
    "Total number of times this item has been collected"
    collectionsCount: Int!
    "Whether the current user has collected this item"
    isCollectedByMe: Boolean!
  }

  extend type ItemList {
    "Total number of times this item has been collected"
    collectionsCount: Int!
    "Whether the current user has collected this item"
    isCollectedByMe: Boolean!
  }
`;
