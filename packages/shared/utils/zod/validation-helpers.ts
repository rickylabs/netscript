/**
 * Zod Validation Helpers
 *
 * Utility functions for creating common Zod schemas with sensible defaults
 * to avoid huge numbers in OpenAPI specs (Number.MAX_SAFE_INTEGER).
 */

import { z } from 'zod';

/**
 * Create a positive integer schema with reasonable max value
 *
 * @param options - Optional configuration
 * @returns Zod number schema
 *
 * @example
 * ```ts
 * const idSchema = positiveInt(); // min: 1, max: 2147483647
 * const idSchema = positiveInt({ max: 1000 }); // min: 1, max: 1000
 * ```
 */
export function positiveInt(options?: {
  min?: number;
  max?: number;
  description?: string;
}): z.ZodNumber {
  const schema = z.number()
    .int()
    .min(options?.min ?? 1)
    .max(options?.max ?? 2147483647); // 32-bit signed int max

  return options?.description ? schema.describe(options.description) : schema;
}

/**
 * Create a non-negative integer schema (includes 0)
 *
 * @param options - Optional configuration
 * @returns Zod number schema
 *
 * @example
 * ```ts
 * const offsetSchema = nonNegativeInt(); // min: 0, max: 2147483647
 * const countSchema = nonNegativeInt({ max: 10000 }); // min: 0, max: 10000
 * ```
 */
export function nonNegativeInt(options?: {
  min?: number;
  max?: number;
  description?: string;
}): z.ZodNumber {
  const schema = z.number()
    .int()
    .min(options?.min ?? 0)
    .max(options?.max ?? 2147483647); // 32-bit signed int max

  return options?.description ? schema.describe(options.description) : schema;
}

/**
 * Create a pagination limit schema with sensible defaults
 *
 * @param options - Optional configuration
 * @returns Zod number schema with default value
 *
 * @example
 * ```ts
 * const limitSchema = paginationLimit(); // min: 1, max: 100, default: 10
 * const limitSchema = paginationLimit({ max: 50, default: 25 });
 * ```
 */
export function paginationLimit(options?: {
  min?: number;
  max?: number;
  default?: number;
  description?: string;
}): z.ZodDefault<z.ZodNumber> {
  const schema = z.number()
    .int()
    .min(options?.min ?? 1)
    .max(options?.max ?? 1000)
    .default(options?.default ?? 10);

  return options?.description ? schema.describe(options.description) : schema;
}

/**
 * Create a pagination offset schema with sensible defaults
 *
 * @param options - Optional configuration
 * @returns Zod number schema with default value
 *
 * @example
 * ```ts
 * const offsetSchema = paginationOffset(); // min: 0, max: 2147483647, default: 0
 * const offsetSchema = paginationOffset({ max: 10000 });
 * ```
 */
export function paginationOffset(options?: {
  min?: number;
  max?: number;
  default?: number;
  description?: string;
}): z.ZodDefault<z.ZodNumber> {
  const schema = z.number()
    .int()
    .min(options?.min ?? 0)
    .max(options?.max ?? 2147483647) // 32-bit signed int max
    .default(options?.default ?? 0);

  return options?.description ? schema.describe(options.description) : schema;
}

// ============================================================================
// STRING PRIMITIVES
// ============================================================================

/**
 * Create an email schema with optional description
 *
 * @example
 * ```ts
 * const emailSchema = email({ description: 'User email address' });
 * ```
 */
export function email(options?: { description?: string }): z.ZodString {
  const schema = z.string().email();
  return options?.description ? schema.describe(options.description) : schema;
}

/**
 * Create a URL schema with optional description
 *
 * @example
 * ```ts
 * const avatarSchema = url({ description: 'Avatar URL' });
 * ```
 */
export function url(options?: { description?: string }): z.ZodString {
  const schema = z.string().url();
  return options?.description ? schema.describe(options.description) : schema;
}

/**
 * Create a bounded string schema with min/max length
 *
 * @example
 * ```ts
 * const nameSchema = boundedString({ min: 1, max: 50, description: 'Full name' });
 * ```
 */
export function boundedString(options: {
  min?: number;
  max: number;
  description?: string;
}): z.ZodString {
  const schema = z.string()
    .min(options.min ?? 1)
    .max(options.max);
  return options?.description ? schema.describe(options.description) : schema;
}

/**
 * Create a positive number (decimal) schema
 *
 * @example
 * ```ts
 * const priceSchema = positiveNumber({ description: 'Price in USD' });
 * ```
 */
export function positiveNumber(options?: { description?: string }): z.ZodNumber {
  const schema = z.number().positive();
  return options?.description ? schema.describe(options.description) : schema;
}

/**
 * Create a non-negative number (decimal, includes 0) schema
 *
 * @example
 * ```ts
 * const totalSchema = nonNegativeNumber({ description: 'Total amount' });
 * ```
 */
export function nonNegativeNumber(options?: { description?: string }): z.ZodNumber {
  const schema = z.number().nonnegative();
  return options?.description ? schema.describe(options.description) : schema;
}

// ============================================================================
// DATETIME PRIMITIVES
// ============================================================================

/**
 * ISO 8601 datetime string regex pattern
 * Matches: 2024-01-15T10:30:00.000Z or 2024-01-15T10:30:00Z
 */
export const ISO_DATETIME_REGEX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

/**
 * Create an ISO datetime string schema
 *
 * @example
 * ```ts
 * const createdAtSchema = isoDateTime({ description: 'Creation timestamp' });
 * ```
 */
export function isoDateTime(options?: { description?: string }): z.ZodString {
  const schema = z.string().regex(ISO_DATETIME_REGEX, 'Invalid ISO datetime');
  return options?.description ? schema.describe(options.description) : schema;
}
