import { z } from 'zod';
import type { FormValues } from '../types.ts';
import type { FormSchemaAdapter, FormSchemaParseResult } from './contract.ts';
import { collectConstraints } from './zod-constraints.ts';
import { resolveZodDefaults } from './zod-defaults.ts';
import { normalizeZodFieldErrors } from './zod-errors.ts';

/**
 * Create a canonical form schema adapter from a Zod schema.
 */
export function createZodAdapter<
  TSchema extends z.ZodTypeAny,
  TValues extends FormValues = z.input<TSchema> & FormValues,
  TOutput = z.output<TSchema>,
>(schema: TSchema): FormSchemaAdapter<TValues, TOutput> {
  return {
    async parse(input: unknown): Promise<TOutput> {
      const result = await schema.safeParseAsync(input);

      if (!result.success) {
        throw result.error;
      }

      return result.data as TOutput;
    },

    async safeParse(input: unknown): Promise<FormSchemaParseResult<TValues, TOutput>> {
      const result = await schema.safeParseAsync(input);

      if (result.success) {
        return {
          success: true,
          data: result.data as TOutput,
        };
      }

      const normalized = normalizeZodFieldErrors<TValues>(
        z.flattenError(result.error),
      );

      return {
        success: false,
        fieldErrors: normalized.fieldErrors,
        formErrors: normalized.formErrors,
      };
    },

    getConstraints() {
      const constraints = {};
      collectConstraints(schema, '', constraints);
      return constraints;
    },

    getDefaults(): Partial<TValues> {
      return resolveZodDefaults<TValues>(schema);
    },
  };
}
