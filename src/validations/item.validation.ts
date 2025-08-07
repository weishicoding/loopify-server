import { z } from 'zod';

const createItemSchema = z.object({
  input: z.object({
    title: z.string().min(1).max(200),
    description: z.string().min(1).max(2000).optional(),
    price: z.number().positive().max(999999.99),
    oldPrice: z.number().positive().max(999999.99).optional(),
    condition: z.enum(['NEW', 'LIKE_NEW', 'USED', 'FOR_PARTS']),
    location: z.string().min(1).max(500).optional(),
    categoryId: z.string().min(1),
    imageUrls: z.array(z.string().url()).max(10).optional(),
  }),
});

const itemQuerySchema = z.object({
  id: z.string().min(1),
});

const itemsQuerySchema = z.object({
  // first and after are excluded from validation as requested
  filter: z.object({
    categoryId: z.string().min(1).optional(),
    sellerId: z.string().min(1).optional(),
    condition: z.enum(['NEW', 'LIKE_NEW', 'USED', 'FOR_PARTS']).optional(),
    minPrice: z.number().positive().optional(),
    maxPrice: z.number().positive().optional(),
    location: z.string().min(1).max(500).optional(),
  }).optional(),
});

export default {
  createItemSchema,
  itemQuerySchema,
  itemsQuerySchema,
};