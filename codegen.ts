import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'src/graphql/schema/**/*.ts',
  generates: {
    'src/graphql/generated/types.ts': {
      plugins: ['typescript', 'typescript-resolvers'],
      config: {
        contextType: 'src/types/index.js#MyContext',
        mappers: {
          User: '@prisma/client#User as PrismaUser',
        },
      },
    },
  },
};

export default config;
