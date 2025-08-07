import { z } from 'zod';

const categoryQuerySchema = z.object({
  id: z.string().min(1),
});

export default {
  categoryQuerySchema,
};