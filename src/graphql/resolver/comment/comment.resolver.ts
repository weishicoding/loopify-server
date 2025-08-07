import { MutationResolvers, MutationCreateCommentArgs, MutationLikeCommentArgs, MutationUnlikeCommentArgs } from '@/graphql/generated/types.js';
import { MyContext } from '@/types/index.js';
import { validateInput } from '@/utils/validation.util.js';
import commentValidation from '@/validations/comment.validation.js';
import logger from '@/lib/logger.js';

const mutation: MutationResolvers<MyContext> = {
  createComment: async (_parent, args: MutationCreateCommentArgs, context: MyContext) => {
    const { itemId, content, parentId } = validateInput(commentValidation.createCommentSchema, args);
    const { userId } = context;
    if (!userId) {
      return {
        success: false,
        message: 'Authentication required',
      };
    }

    try {
      await context.models.comment.createComment(userId, itemId, content, parentId || undefined);
      return {
        success: true,
        message: 'Comment created successfully',
      };
    } catch (error) {
      logger.error('Error creating comment:', error);
      return {
        success: false,
        message: 'Failed to create comment',
      };
    }
  },

  likeComment: async (_parent, args: MutationLikeCommentArgs, context: MyContext) => {
    const { commentId } = validateInput(commentValidation.likeCommentSchema, args);
    const { userId } = context;
    if (!userId) {
      return {
        success: false,
        message: 'Authentication required',
      };
    }

    try {
      await context.models.comment.likeComment(userId, commentId);
      return {
        success: true,
        message: 'Comment liked successfully',
      };
    } catch (error) {
      logger.error('Error liking comment:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to like comment',
      };
    }
  },

  unlikeComment: async (_parent, args: MutationUnlikeCommentArgs, context: MyContext) => {
    const { commentId } = validateInput(commentValidation.unlikeCommentSchema, args);
    const { userId } = context;
    if (!userId) {
      return {
        success: false,
        message: 'Authentication required',
      };
    }

    try {
      await context.models.comment.unlikeComment(userId, commentId);
      return {
        success: true,
        message: 'Comment unliked successfully',
      };
    } catch (error) {
      logger.error('Error unliking comment:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to unlike comment',
      };
    }
  },
};

export const commentResolvers = {
  Mutation: mutation,
};