/**
 * Common Zod Schemas
 *
 * Reusable schemas for common patterns like pagination, IDs, etc.
 */

import { z } from 'zod';
import { paginationLimit, paginationOffset, positiveInt } from './validation-helpers.ts';
import { stringToInt } from './codecs.ts';

// ============================================================================
// PAGINATION SCHEMAS
// ============================================================================

/**
 * Offset-based pagination input (for request bodies)
 *
 * Use for: Simple pagination, small datasets, SQL databases
 * Pros: Simple, predictable page numbers
 * Cons: Performance degrades with large offsets, inconsistent with concurrent writes
 */
export const OffsetPaginationInputSchema = z.object({
  limit: paginationLimit({ description: 'Results per page' }),
  offset: paginationOffset({ description: 'Offset for pagination' }),
});

/**
 * Offset-based pagination input (for query parameters)
 *
 * Uses codecs to coerce string query params to numbers.
 *
 * **Use this for GET requests with query parameters!**
 *
 * Note: offset defaults to 0. Prisma adds OFFSET to SQL queries regardless of whether
 * skip is provided or not (known issue: https://github.com/prisma/prisma/issues/6153
 * and https://github.com/prisma/prisma/issues/21583), so we use a simple default
 * rather than conditional logic.
 *
 * @example
 * ```ts
 * // Contract definition
 * list: oc
 *   .input(OffsetPaginationQuerySchema)
 *   .output(...)
 *
 * // HTTP: GET /api/list?limit=10&offset=0
 * // Decoded: { limit: 10, offset: 0 } (numbers, not strings!)
 * ```
 */
export const OffsetPaginationQuerySchema = z.object({
  limit: stringToInt(paginationLimit({ description: 'Results per page' })).optional().default(10),
  offset: stringToInt(paginationOffset({ description: 'Offset for pagination' })).optional()
    .default(0),
});

/**
 * Cursor-based pagination input (for request bodies)
 *
 * Use for: Real-time feeds, infinite scroll, large datasets
 * Pros: Consistent results with concurrent writes, better performance
 * Cons: Can't jump to arbitrary pages, more complex implementation
 */
export const CursorPaginationInputSchema = z.object({
  limit: paginationLimit({ description: 'Results per page' }),
  cursor: z.string().optional().describe('Cursor for next page'),
});

/**
 * Cursor-based pagination input (for query parameters)
 *
 * Uses codecs to coerce string query params to numbers.
 *
 * **Use this for GET requests with query parameters!**
 */
export const CursorPaginationQuerySchema = z.object({
  limit: stringToInt(paginationLimit({ description: 'Results per page' })).optional().default(10),
  cursor: z.string().optional().describe('Cursor for next page'),
});

// ============================================================================
// ID SCHEMAS
// ============================================================================

/**
 * ID parameter schema (for request bodies)
 */
export const IdParamSchema = z.object({
  id: positiveInt({ description: 'Resource ID' }),
});

/**
 * ID parameter schema for query parameters
 *
 * Uses codec to coerce string query param to number.
 *
 * **Use this for GET/DELETE requests with ID in query params!**
 */
export const IdQuerySchema = z.object({
  id: stringToInt(positiveInt({ description: 'Resource ID' })),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type OffsetPaginationInput = z.infer<typeof OffsetPaginationInputSchema>;
export type OffsetPaginationQuery = z.infer<typeof OffsetPaginationQuerySchema>;
export type CursorPaginationInput = z.infer<typeof CursorPaginationInputSchema>;
export type CursorPaginationQuery = z.infer<typeof CursorPaginationQuerySchema>;
export type IdParam = z.infer<typeof IdParamSchema>;
export type IdQuery = z.infer<typeof IdQuerySchema>;
