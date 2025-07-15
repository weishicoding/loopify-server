import { ZodSchema } from 'zod';
import { UserInputError } from 'apollo-server-errors';
import { ConnectionArguments } from '@/types/index.js';

/**
 * Validates input data against a Zod schema.
 * Throws a UserInputError if validation fails.
 * @param schema
 * @param data
 * @returns {T}
 * @throws {UserInputError} If validation fails
 */
export const validateInput = <T>(schema: ZodSchema<T>, data: unknown): T => {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new UserInputError('Invalid input', {
      validationErrors: result.error.format()
    });
  }
  return result.data;
};

/**
 * Validate pagination arguments to conform with supported forward/backward pagination logic.
 * Throws UserInputError if invalid combinations are provided.
 * @param args
 * @throws {UserInputError} If validation fails
 */
export function validatePaginationArgs(args: ConnectionArguments) {
  const { first, after, last, before } = args;

  if ((first && last) || (after && before)) {
    throw new UserInputError('Cannot use both forward and backward pagination arguments together.');
  }

  if (first && before) {
    throw new UserInputError(
      'Cannot use "first" with "before". Use "first" with "after" for forward pagination.'
    );
  }

  if (last && after) {
    throw new UserInputError(
      'Cannot use "last" with "after". Use "last" with "before" for backward pagination.'
    );
  }
}
