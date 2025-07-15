import { z } from 'zod';

const verifyUserId = z.object({
  userId: z.string().nonempty()
});

export default {
  verifyUserId
};
