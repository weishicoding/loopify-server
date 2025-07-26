import { gql } from 'graphql-tag';

export const itemTypeDefs = gql`
  enum ItemCondition {
    NEW
    LIKE_NEW
    USED
    FOR_PARTS
  }

  input CreateItemInput {
    """
    The title of the item listing.
    """
    title: String

    """
    A detailed description of the item. Required.
    """
    description: String!

    """
    The asking price. Use Float in GraphQL, but we will handle it
    as a precise Decimal in the backend. Required.
    """
    price: Float!

    """
    The condition of the item. Required.
    """
    condition: ItemCondition!

    """
    The ID of the category this item belongs to. Required.
    """
    categoryId: ID!

    """
    A list of public URLs for the item's images. Must have at least one. Required.
    """
    imageUrls: [String!]!

    """
    (Optional) A simple string for the item's location.
    """
    location: String
  }

  type Item {
    title: String
    description: String!
    isDiscount: Boolean!
    price: Float!
    originalPrice: Float!
    imageUrls: [String!]!
    location: String
  }

  extend type Mutation {
    createItem(input: CreateItemInput!): GenericResponse!
  }
`;
