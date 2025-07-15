import { z } from 'zod';

const verifyFollowerIdAndFollowingId = z.object({
  followerId: z.string().nonempty(),
  followingId: z.string().nonempty()
});

export default {
  verifyFollowerIdAndFollowingId
};
