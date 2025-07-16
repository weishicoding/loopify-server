import { ZodSchema } from 'zod';
import { UserInputError } from 'apollo-server-errors';

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
      validationErrors: result.error.format(),
    });
  }
  return result.data;
};
