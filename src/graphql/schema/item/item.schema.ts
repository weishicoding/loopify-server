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

  input ItemsFilterInput {
    """
    Filter items by a specific category ID.
    """
    categoryId: ID

    """
    Filter items by a specific seller's ID.
    """
    sellerId: ID

    """
    A search term to match against item titles and descriptions.
    """
    searchTerm: String

    """
    Filter by a minimum price.
    """
    minPrice: Float

    """
    Filter by a maximum price.
    """
    maxPrice: Float

    """
    Filter by a specific item condition.
    """
    condition: ItemCondition
  }

  type ItemDetail {
    id: ID!
    title: String
    description: String!
    price: Float!
    oldPrice: Float
    imageUrls: [String!]!
    """
    The user who listed this item for sale.
    """
    seller: User!
    condition: ItemCondition!
    location: String
    """
    The category this item belongs to.
    """
    category: Categories! # An item must have a category.
    """
    Public comments or questions about this item.
    """
    comments(first: Int, after: String): CommentConnection!
  }

  type ItemList {
    id: ID!
    title: String
    description: String!
    price: Float!
    oldPrice: Float
    imageUrl: String!
    seller: User!
  }

  type ItemEdge implements Edge {
    cursor: ID!
    node: ItemList!
  }

  type ItemConnection implements Connection {
    edges: [ItemEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type Comment {
    id: ID!
    context: String!
    user: User!
    children: Comment
  }

  type CommentEdge implements Edge {
    cursor: ID!
    node: Comment!
  }

  # Define the type of Connection
  type CommentConnection implements Connection {
    edges: [CommentEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  extend type Query {
    """
    Fetches a single item by its unique ID.
    """
    item(id: ID!): ItemDetail

    """
    Fetches a paginated list of items, with optional filtering and sorting.
    """
    items(
      first: Int!
      after: String
      filter: ItemsFilterInput # You could also add sorting options here, e.g., sortBy: ItemSortInput
    ): ItemConnection!
  }

  extend type Mutation {
    createItem(input: CreateItemInput!): GenericResponse!
  }
`;
