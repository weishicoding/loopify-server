import { gql } from 'graphql-tag';

export const followTypeDefs = gql`
  extend type Mutation {
    "A user follow other user"
    followUser(followerId: ID!, followingId: ID!): GenericResponse! @auth
    "A user cancel to follow other user"
    unfollowUser(followerId: ID!, followingId: ID!): GenericResponse! @auth
  }
`;
