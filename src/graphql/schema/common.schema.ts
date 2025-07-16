import { gql } from 'graphql-tag';

export const commonTypeDefs = gql`
  """
  A standard response for mutations that don't return a specific object.
  Indicates the success status and provides a user-friendly message.
  """
  type GenericResponse {
    success: Boolean!
    message: String!
  }

  """
  Represents a single "edge" in a connection, connecting a node to a cursor.
  """
  interface Edge {
    cursor: ID!
  }

  """
  Contians information about page in a connection
  """
  type PageInfo {
    """
    The cursor of the last edge in the connection.
    """
    endCursor: String
    """
    Indicates if there are more pages when paginating forwards.
    """
    hasNextPage: Boolean!
  }

  """
  A generic connection type, conforming to the Relay Cursor Connections Specification.
  """
  interface Connection {
    edges: [Edge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }
`;
