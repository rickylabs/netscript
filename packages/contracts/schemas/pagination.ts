/**
 * Pagination schemas for standardized list operations.
 *
 * @example
 * ```typescript
 * import { PaginationInputSchema, createPaginatedOutput } from '@netscript/contracts';
 *
 * const usersListContract = baseContract
 *   .route({ method: 'GET', path: '/users' })
 *   .input(PaginationInputSchema)
 *   .output(createPaginatedOutput(UserSchema));
 * ```
 *
 * @module
 */

import { z } from 'zod';

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

/**
 * Standard pagination input schema for list endpoints.
 * Supports page-based pagination with sorting.
 */
export const PaginationInputSchema = z.object({
  /** Page number (1-indexed) */
  page: z.coerce.number().int().min(1).default(1),
  /** Items per page (1-100) */
  limit: z.coerce.number().int().min(1).max(100).default(10),
  /** Field to sort by */
  sortBy: z.string().optional(),
  /** Sort direction */
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Offset-based pagination input schema.
 * Alternative to page-based pagination for more flexibility.
 */
export const OffsetPaginationInputSchema = z.object({
  /** Number of items to skip */
  offset: z.coerce.number().int().min(0).default(0),
  /** Number of items to return */
  limit: z.coerce.number().int().min(1).max(100).default(10),
  /** Field to sort by */
  sortBy: z.string().optional(),
  /** Sort direction */
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Cursor-based pagination input schema.
 * Best for infinite scroll and real-time data.
 */
export const CursorPaginationInputSchema = z.object({
  /** Cursor for fetching next page */
  cursor: z.string().optional(),
  /** Number of items to return */
  limit: z.coerce.number().int().min(1).max(100).default(10),
  /** Direction to paginate */
  direction: z.enum(['forward', 'backward']).default('forward'),
});

// ============================================================================
// OUTPUT SCHEMAS
// ============================================================================

/**
 * Standard pagination metadata for responses.
 */
export const PaginationOutputSchema = z.object({
  /** Current page number */
  page: z.number(),
  /** Items per page */
  limit: z.number(),
  /** Total number of items */
  total: z.number(),
  /** Total number of pages */
  totalPages: z.number(),
  /** Whether there's a next page */
  hasNext: z.boolean(),
  /** Whether there's a previous page */
  hasPrev: z.boolean(),
});

/**
 * Cursor pagination metadata for responses.
 */
export const CursorPaginationOutputSchema = z.object({
  /** Cursor for next page */
  nextCursor: z.string().nullable(),
  /** Cursor for previous page */
  prevCursor: z.string().nullable(),
  /** Whether there are more items */
  hasMore: z.boolean(),
});

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Creates a paginated output schema for a given item schema.
 *
 * @example
 * ```typescript
 * const UserListSchema = createPaginatedOutput(UserSchema);
 * // { data: User[], pagination: PaginationOutput }
 * ```
 */
export function createPaginatedOutput<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    pagination: PaginationOutputSchema,
  });
}

/**
 * Creates a cursor-paginated output schema for a given item schema.
 *
 * @example
 * ```typescript
 * const UserListSchema = createCursorPaginatedOutput(UserSchema);
 * // { data: User[], pagination: CursorPaginationOutput }
 * ```
 */
export function createCursorPaginatedOutput<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    pagination: CursorPaginationOutputSchema,
  });
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type PaginationInput = z.infer<typeof PaginationInputSchema>;
export type OffsetPaginationInput = z.infer<typeof OffsetPaginationInputSchema>;
export type CursorPaginationInput = z.infer<typeof CursorPaginationInputSchema>;
export type PaginationOutput = z.infer<typeof PaginationOutputSchema>;
export type CursorPaginationOutput = z.infer<typeof CursorPaginationOutputSchema>;

/**
 * Generic paginated result type.
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationOutput;
}

/**
 * Generic cursor-paginated result type.
 */
export interface CursorPaginatedResult<T> {
  data: T[];
  pagination: CursorPaginationOutput;
}
