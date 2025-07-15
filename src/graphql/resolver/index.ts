import { authResolver } from './auth/auth.resolver.js';
import { followResolver } from './user/follow.resolver.js';
import { userResolver } from './user/user.resolver.js';

export const resolvers = [userResolver, authResolver, followResolver];
