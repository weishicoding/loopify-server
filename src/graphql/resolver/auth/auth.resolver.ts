import { MyContext } from '@/types/index.js';
import { MutationResolvers } from '../../generated/types.js';
import { validateInput } from '@/utils/validation.util.js';
import authValidation from '@/validations/auth.validation.js';

const mutation: MutationResolvers<MyContext> = {
  sendEmailCode: (_any, { email }, context) => {
    validateInput(authValidation.requestCodeSchema, { email });
    return context.models.auth.sendEmailCode(email);
  },
  loginWithCode: (_any, args, context) => {
    const { email, code } = args;
    validateInput(authValidation.verifyCodeSchema, { email, code });
    return context.models.auth.loginWithCode(email, code);
  },
  refreshToken: (_any, { refreshToken }, context) => {
    validateInput(authValidation.refreshTokenSchema, { refreshToken });
    return context.models.auth.refreshToken(refreshToken);
  },
  logout: (_any, { refreshToken }, context) => {
    validateInput(authValidation.refreshTokenSchema, { refreshToken });
    return context.models.auth.logout(refreshToken);
  },
};

export const authResolver = {
  Mutation: mutation,
};
