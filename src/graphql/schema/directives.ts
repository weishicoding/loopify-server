import { gql } from 'graphql-tag';

export const directiveTypeDefs = gql`
  directive @auth on FIELD_DEFINITION
`;
