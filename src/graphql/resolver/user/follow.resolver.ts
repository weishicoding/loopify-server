import { MutationResolvers } from '@/graphql/generated/types.js';
import { MyContext } from '@/types/index.js';
import { validateInput } from '@/utils/validation.util.js';
import followValidation from '@/validations/follow.validation.js';

const mutation: MutationResolvers<MyContext> = {
  followUser: (_any, { followerId, followingId }, context) => {
    validateInput(followValidation.verifyFollowerIdAndFollowingId, { followerId, followingId });

    return context.models.follow.followUser(followerId, followingId);
  },
  unfollowUser: (_any, { followerId, followingId }, context) => {
    validateInput(followValidation.verifyFollowerIdAndFollowingId, { followerId, followingId });

    return context.models.follow.unfollowUser(followerId, followingId);
  },
};

export const followResolver = {
  Mutation: mutation,
};
