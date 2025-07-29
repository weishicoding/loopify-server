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

  type CommentEdge implements Edge {
    cursor: ID!
    node: User!
  }

  # Define the type of Connection
  type CommentConnection implements Connection {
    edges: [CommentEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type Item {
    id: ID!
    title: String
    description: String!
    isDiscount: Boolean!
    price: Float!
    originalPrice: Float!
    condition: ItemCondition!
    imageUrls: [String!]!
    location: String
    createdAt: String! # Use String for ISO date format
    """
    The user who listed this item for sale.
    """
    seller: User! # An item must have a seller.
    """
    The category this item belongs to.
    """
    category: Categories! # An item must have a category.
    """
    Public comments or questions about this item.
    """
    comments(first: Int, after: String): CommentConnection! # Use a Connection for paginated comments
  }

  extend type Query {
    """
    Fetches a single item by its unique ID.
    """
    item(id: ID!): Item
  }

  extend type Mutation {
    createItem(input: CreateItemInput!): GenericResponse!
  }
`;
