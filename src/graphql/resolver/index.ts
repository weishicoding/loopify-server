import { authResolver } from './auth/auth.resolver.js';
import { uploadResolver } from './upload/upload.resolver.js';
import { followResolver } from './user/follow.resolver.js';
import { userResolver } from './user/user.resolver.js';

export const resolvers = [userResolver, authResolver, followResolver, uploadResolver];
