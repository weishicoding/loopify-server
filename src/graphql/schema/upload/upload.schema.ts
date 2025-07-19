import { gql } from 'graphql-tag';

export const uploadTypeDefs = gql`
  """
  Describes a single file that the client wants to upload.
  """
  input FileUploadInfoInput {
    fileType: String!
    fileSize: Int!
    """
    A client-side identifier to match the response with the request.
    """
    customId: String
  }

  type FileUploadResponse {
    """
    The temporary, secure URL to use for the PUT request to upload the file.
    """
    uploadUrl: String!
    """
    The final public URL of the file after a successful upload.
    """
    publicUrl: String!
    customId: String
  }

  extend type Mutation {
    generateUploadUrl(files: [FileUploadInfoInput!]!): [FileUploadResponse!]! @auth
  }
`;
