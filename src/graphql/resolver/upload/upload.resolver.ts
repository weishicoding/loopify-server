import { ApolloError, AuthenticationError } from 'apollo-server-errors';
import { getS3PresignedUrl } from '@/lib/s3.js';
import logger from '@/lib/logger.js';
import { getErrorMessage } from '@/utils/error.util.js';
import { validateInput } from '@/utils/validation.util.js';
import uploadValidation from '@/validations/upload.validation.js';
import { MyContext } from '@/types/index.js';
import { MutationResolvers, FileUploadInfoInput } from '../../generated/types.js';

const mutation: MutationResolvers<MyContext> = {
  generateUploadUrl: async (_parent, args, context) => {
    const { files } = validateInput(uploadValidation.generateUploadUrlSchema, args);
    const { userId } = context;
    if (!userId) {
      throw new AuthenticationError('User is not authenticated');
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
