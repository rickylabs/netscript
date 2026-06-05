import { z } from 'zod';
import {
  DEFAULT_INTEGER_MAX,
  DEFAULT_PAGINATION_LIMIT,
  DEFAULT_PAGINATION_LIMIT_MAX,
  DEFAULT_PAGINATION_OFFSET,
} from '../domain/constants.ts';
import type {
  SharedDefaultableSchema,
  SharedNumberSchema,
  SharedSchema,
  SharedStringSchema,
} from '../domain/schema-types.ts';

/** Options accepted by shared integer schema factories. */
export type IntegerSchemaOptions = Readonly<{
  min?: number;
  max?: number;
  description?: string;
}>;

/** Options accepted by shared defaulted integer schema factories. */
export type DefaultedIntegerSchemaOptions =
  & IntegerSchemaOptions
  & Readonly<{
    default?: number;
  }>;

/** Options accepted by shared string schema factories. */
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
export function positiveInt(options: IntegerSchemaOptions = {}): SharedNumberSchema {
  const schema = z.number()
    .int()
    .min(options.min ?? 1)
    .max(options.max ?? DEFAULT_INTEGER_MAX);

  return (options.description
    ? schema.describe(options.description)
    : schema) as unknown as SharedNumberSchema;
}

/** Creates a non-negative integer schema with NetScript's default integer cap. */
export function nonNegativeInt(options: IntegerSchemaOptions = {}): SharedNumberSchema {
  const schema = z.number()
    .int()
    .min(options.min ?? 0)
    .max(options.max ?? DEFAULT_INTEGER_MAX);

  return (options.description
    ? schema.describe(options.description)
    : schema) as unknown as SharedNumberSchema;
}

/** Creates a defaulted pagination-limit schema. */
export function paginationLimit(
  options: DefaultedIntegerSchemaOptions = {},
): SharedNumberSchema {
  const schema = z.number()
    .int()
    .min(options.min ?? 1)
    .max(options.max ?? DEFAULT_PAGINATION_LIMIT_MAX)
    .default(options.default ?? DEFAULT_PAGINATION_LIMIT);

  return (options.description
    ? schema.describe(options.description)
    : schema) as unknown as SharedNumberSchema;
}

/** Creates a defaulted pagination-offset schema. */
export function paginationOffset(
  options: DefaultedIntegerSchemaOptions = {},
): SharedNumberSchema {
  const schema = z.number()
    .int()
    .min(options.min ?? 0)
    .max(options.max ?? DEFAULT_INTEGER_MAX)
    .default(options.default ?? DEFAULT_PAGINATION_OFFSET);

  return (options.description
    ? schema.describe(options.description)
    : schema) as unknown as SharedNumberSchema;
}

/** Creates a bounded string schema. */
export function boundedString(options: BoundedStringSchemaOptions): SharedStringSchema {
  const schema = z.string()
    .min(options.min ?? 1)
    .max(options.max);

  return (options.description
    ? schema.describe(options.description)
    : schema) as unknown as SharedStringSchema;
}

/** Creates a positive decimal-number schema. */
export function positiveNumber(options: StringSchemaOptions = {}): SharedNumberSchema {
  const schema = z.number().positive();
  return (options.description
    ? schema.describe(options.description)
    : schema) as unknown as SharedNumberSchema;
}

/** Creates a non-negative decimal-number schema. */
export function nonNegativeNumber(options: StringSchemaOptions = {}): SharedNumberSchema {
  const schema = z.number().nonnegative();
  return (options.description
    ? schema.describe(options.description)
    : schema) as unknown as SharedNumberSchema;
}

/** Coerces a numeric string into a number and validates it with `outputSchema`. */
export function stringToNumber(
  outputSchema: SharedDefaultableSchema<number>,
): SharedSchema<number> {
  return z.codec(z.string().regex(z.regexes.number), outputSchema as z.ZodNumber, {
    decode: (value) => Number.parseFloat(value),
    encode: (value) => (value ?? 0).toString(),
  }) as unknown as SharedSchema<number>;
}

/** Coerces an integer string into a number and validates it with `outputSchema`. */
export function stringToInt(
  outputSchema: SharedDefaultableSchema<number>,
): SharedSchema<number> {
  return z.codec(z.string().regex(z.regexes.integer), outputSchema as z.ZodNumber, {
    decode: (value) => Number.parseInt(value, 10),
    encode: (value) => (value ?? 0).toString(),
  }) as unknown as SharedSchema<number>;
}
