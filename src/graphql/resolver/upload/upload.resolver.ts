import { ApolloError, AuthenticationError, UserInputError } from 'apollo-server-errors';
import { getS3PresignedUrl } from '@/lib/s3.js';
import logger from '@/lib/logger.js';
import { getErrorMessage } from '@/utils/error.util.js';
import { MyContext } from '@/types/index.js';
import { MutationResolvers, FileUploadInfoInput } from '../../generated/types.js';

const mutation: MutationResolvers<MyContext> = {
  generateUploadUrl: async (_parent, { files }, context) => {
    const { userId } = context;
    if (!userId) {
      throw new AuthenticationError('User is not authenticated');
    }
    if (!files || files.length === 0) {
      throw new UserInputError('You must provide at least one file to upload.');
    }
    if (files.length > 10) {
      throw new UserInputError('You cannot request more than 10 upload URLs at a time.');
    }
    try {
      const uploadPromises = files.map(async (file: FileUploadInfoInput) => {
        const { uploadUrl, publicUrl } = await getS3PresignedUrl(file.fileType, file.fileSize);
        return {
          uploadUrl,
          publicUrl,
          customId: file.customId,
        };
      });
      return await Promise.all(uploadPromises);
    } catch (error) {
      logger.error(`Failed to generate upload URLs. ${getErrorMessage(error)}`);
      throw new ApolloError('Failed to generate upload URLs.');
    }
  },
};

export const uploadResolver = {
  Mutation: mutation,
};
