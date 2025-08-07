import { z } from 'zod';

const createCommentSchema = z.object({
  itemId: z.string().min(1),
  content: z.string().min(1).max(2000),
  parentId: z.string().min(1).optional(),
});

const likeCommentSchema = z.object({
  commentId: z.string().min(1),
});

const unlikeCommentSchema = z.object({
  commentId: z.string().min(1),
});

export default {
  createCommentSchema,
  likeCommentSchema,
  unlikeCommentSchema,
};