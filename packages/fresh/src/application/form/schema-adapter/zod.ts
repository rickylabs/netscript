import { z } from 'zod';
import type { FormValues } from '../runtime/types.ts';
import type { FormSchemaAdapter, FormSchemaParseResult } from './contract.ts';
import type { StandardSchemaV1 } from './standard.ts';
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
  const standardSchema = schema as StandardSchemaV1<unknown, TOutput>;

  return {
    async parse(input: unknown): Promise<TOutput> {
      const result = await standardSchema['~standard'].validate(input);

      if ('issues' in result) {
        throw createZodStandardSchemaError(result.issues);
      }

      return result.value as TOutput;
    },

    async safeParse(input: unknown): Promise<FormSchemaParseResult<TValues, TOutput>> {
      const result = await standardSchema['~standard'].validate(input);

      if ('value' in result) {
        return {
          success: true,
          data: result.value as TOutput,
        };
      }

      const normalized = normalizeZodFieldErrors<TValues>(
        z.flattenError(createZodStandardSchemaError(result.issues)),
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

function createZodStandardSchemaError(issues: readonly unknown[]): z.ZodError {
  return new z.ZodError(issues as z.core.$ZodIssue[]);
}
