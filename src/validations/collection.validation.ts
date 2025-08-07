import { z } from 'zod';

const collectItemSchema = z.object({
  itemId: z.string().min(1),
});

const uncollectItemSchema = z.object({
  itemId: z.string().min(1),
});

export default {
  collectItemSchema,
  uncollectItemSchema,
};