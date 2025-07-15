import { gql } from 'graphql-tag';

export const authTypeDefs = gql`
  type AuthPayload {
    """
    Access token for authentication
    """
    accessToken: String!

    """
    Refresh token for refreshing access token when access token has expired
    """
    refreshToken: String!
    userId: String!
  }

  extend type Mutation {
    sendEmailCode(email: String!): GenericResponse!
    loginWithCode(email: String!, code: String!): AuthPayload!
    refreshToken(refreshToken: String!): AuthPayload!
    logout(refreshToken: String!): GenericResponse! @auth
  }
`;
