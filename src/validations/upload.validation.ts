import { z } from 'zod';

const generateUploadUrlSchema = z.object({
  files: z.array(z.object({
    fileType: z.string().min(1),
    fileSize: z.number().positive().max(50 * 1024 * 1024), // 50MB max
    customId: z.string().min(1).optional(),
  })).min(1).max(10),
});

export default {
  generateUploadUrlSchema,
};