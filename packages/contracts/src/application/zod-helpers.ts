import { z } from 'zod';
import {
  DEFAULT_INTEGER_MAX,
  DEFAULT_PAGINATION_LIMIT,
  DEFAULT_PAGINATION_LIMIT_MAX,
  DEFAULT_PAGINATION_OFFSET,
} from '../domain/constants.ts';
import type { ContractNumberSchema, ContractStringSchema } from '../domain/schema-types.ts';

/** Options accepted by contract integer schema factories. */
export type IntegerSchemaOptions = Readonly<{
  min?: number;
  max?: number;
  description?: string;
}>;

/** Options accepted by contract defaulted integer schema factories. */
export type DefaultedIntegerSchemaOptions =
  & IntegerSchemaOptions
  & Readonly<{
    default?: number;
  }>;

/** Options accepted by contract string schema factories. */
export type StringSchemaOptions = Readonly<{
  description?: string;
}>;

/** Options accepted by bounded string schema factories. */
export type BoundedStringSchemaOptions =
  & StringSchemaOptions
  & Readonly<{
    min?: number;
    max: number;
  }>;

/** Creates a positive integer schema with NetScript's default integer cap. */
export function positiveInt(options: IntegerSchemaOptions = {}): ContractNumberSchema {
  const schema = z.number()
    .int()
    .min(options.min ?? 1)
    .max(options.max ?? DEFAULT_INTEGER_MAX);

  return options.description ? schema.describe(options.description) : schema;
}

/** Creates a non-negative integer schema with NetScript's default integer cap. */
export function nonNegativeInt(options: IntegerSchemaOptions = {}): ContractNumberSchema {
  const schema = z.number()
    .int()
    .min(options.min ?? 0)
    .max(options.max ?? DEFAULT_INTEGER_MAX);

  return options.description ? schema.describe(options.description) : schema;
}

/** Creates a defaulted pagination-limit schema. */
export function paginationLimit(
  options: DefaultedIntegerSchemaOptions = {},
): ContractNumberSchema {
  const schema = z.number()
    .int()
    .min(options.min ?? 1)
    .max(options.max ?? DEFAULT_PAGINATION_LIMIT_MAX)
    .default(options.default ?? DEFAULT_PAGINATION_LIMIT);

  return options.description ? schema.describe(options.description) : schema;
}

/** Creates a defaulted pagination-offset schema. */
export function paginationOffset(
  options: DefaultedIntegerSchemaOptions = {},
): ContractNumberSchema {
  const schema = z.number()
    .int()
    .min(options.min ?? 0)
    .max(options.max ?? DEFAULT_INTEGER_MAX)
    .default(options.default ?? DEFAULT_PAGINATION_OFFSET);

  return options.description ? schema.describe(options.description) : schema;
}

/** Creates a bounded string schema. */
export function boundedString(options: BoundedStringSchemaOptions): ContractStringSchema {
  const schema = z.string()
    .min(options.min ?? 1)
    .max(options.max);

  return options.description ? schema.describe(options.description) : schema;
}

/** Creates a positive decimal-number schema. */
export function positiveNumber(options: StringSchemaOptions = {}): ContractNumberSchema {
  const schema = z.number().positive();
  return options.description ? schema.describe(options.description) : schema;
}

/** Creates a non-negative decimal-number schema. */
export function nonNegativeNumber(options: StringSchemaOptions = {}): ContractNumberSchema {
  const schema = z.number().nonnegative();
  return options.description ? schema.describe(options.description) : schema;
}

/** Coerces a numeric string into a number and validates it with `outputSchema`. */
export function stringToNumber(
  outputSchema: ContractNumberSchema,
): z.ZodCodec<z.ZodString, ContractNumberSchema> {
  return z.codec(z.string().regex(z.regexes.number), outputSchema, {
    decode: (value: string) => Number.parseFloat(value),
    encode: (value: number | undefined) => (value ?? 0).toString(),
  });
}

/** Coerces an integer string into a number and validates it with `outputSchema`. */
export function stringToInt(
  outputSchema: ContractNumberSchema,
): z.ZodCodec<z.ZodString, ContractNumberSchema> {
  return z.codec(z.string().regex(z.regexes.integer), outputSchema, {
    decode: (value: string) => Number.parseInt(value, 10),
    encode: (value: number | undefined) => (value ?? 0).toString(),
  });
}
