import { gql } from 'graphql-tag';

export const userTypeDefs = gql`
  # Define the relationship of User of Connection Edge
  type UserEdge implements Edge {
    cursor: ID!
    node: User!
  }

  # Define the type of Connection
  type UserConnection implements Connection {
    edges: [UserEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }
  type User {
    id: ID!
    email: String!
    name: String

    """
    The total number of users that are following this user.
    """
    followerCount: Int!
    """
    The total number of users that this user is following.
    """
    followingCount: Int!

    """
    A list of users that are following this user.
    """
    followers(first: Int, after: String, last: Int, before: String): UserConnection!

    """
    A list of users that this user is following.
    """
    following(first: Int, after: String, last: Int, before: String): UserConnection!

    """
    Indicates if the currently authenticated user is following this user.
    """
    isFollowedByMe: Boolean!
  }

  extend type Query {
    "Get the currently authenticated user's profile."
    me: User @auth
    "Get a user's profile by their ID."
    user(id: String!): User @auth
  }
`;
