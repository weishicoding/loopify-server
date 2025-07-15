import { z } from 'zod';

const requestCodeSchema = z.object({
  email: z.string().email()
});

const verifyCodeSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6)
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().nonempty()
});

export default {
  requestCodeSchema,
  verifyCodeSchema,
  refreshTokenSchema
};
