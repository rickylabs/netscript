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
import type { ContractObjectSchema, ContractSchema } from '../src/domain/schema-types.ts';

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

/**
 * Standard pagination input schema for list endpoints.
 * Supports page-based pagination with sorting.
 */
export const PaginationInputSchema: ContractObjectSchema<PaginationInput> = z.object({
  /** Page number (1-indexed) */
  page: z.coerce.number().int().min(1).default(1),
  /** Items per page (1-100) */
  limit: z.coerce.number().int().min(1).max(100).default(10),
  /** Field to sort by */
  sortBy: z.string().optional(),
  /** Sort direction */
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
}) as unknown as ContractObjectSchema<PaginationInput>;

/**
 * Offset-based pagination input schema.
 * Alternative to page-based pagination for more flexibility.
 */
export const OffsetPaginationInputSchema: ContractObjectSchema<OffsetPaginationInput> = z.object({
  /** Number of items to skip */
  offset: z.coerce.number().int().min(0).default(0),
  /** Number of items to return */
  limit: z.coerce.number().int().min(1).max(100).default(10),
  /** Field to sort by */
  sortBy: z.string().optional(),
  /** Sort direction */
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
}) as unknown as ContractObjectSchema<OffsetPaginationInput>;

/**
 * Cursor-based pagination input schema.
 * Best for infinite scroll and real-time data.
 */
export const CursorPaginationInputSchema: ContractObjectSchema<CursorPaginationInput> = z.object({
  /** Cursor for fetching next page */
  cursor: z.string().optional(),
  /** Number of items to return */
  limit: z.coerce.number().int().min(1).max(100).default(10),
  /** Direction to paginate */
  direction: z.enum(['forward', 'backward']).default('forward'),
}) as unknown as ContractObjectSchema<CursorPaginationInput>;

// ============================================================================
// OUTPUT SCHEMAS
// ============================================================================

/**
 * Standard pagination metadata for responses.
 */
export const PaginationOutputSchema: ContractObjectSchema<PaginationOutput> = z.object({
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
}) as unknown as ContractObjectSchema<PaginationOutput>;

/**
 * Cursor pagination metadata for responses.
 */
export const CursorPaginationOutputSchema: ContractObjectSchema<CursorPaginationOutput> = z.object({
  /** Cursor for next page */
  nextCursor: z.string().nullable(),
  /** Cursor for previous page */
  prevCursor: z.string().nullable(),
  /** Whether there are more items */
  hasMore: z.boolean(),
}) as unknown as ContractObjectSchema<CursorPaginationOutput>;

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
export function createPaginatedOutput<T>(
  itemSchema: ContractSchema<T>,
): ContractObjectSchema<PaginatedResult<T>> {
  return z.object({
    data: z.array(itemSchema as z.ZodType<T>),
    pagination: PaginationOutputSchema as unknown as z.ZodType<PaginationOutput>,
  }) as unknown as ContractObjectSchema<PaginatedResult<T>>;
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
export function createCursorPaginatedOutput<T>(
  itemSchema: ContractSchema<T>,
): ContractObjectSchema<CursorPaginatedResult<T>> {
  return z.object({
    data: z.array(itemSchema as z.ZodType<T>),
    pagination: CursorPaginationOutputSchema as unknown as z.ZodType<CursorPaginationOutput>,
  }) as unknown as ContractObjectSchema<CursorPaginatedResult<T>>;
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/** Page-based pagination input. */
export type PaginationInput = Readonly<{
  /** Page number. */
  page: number;
  /** Items per page. */
  limit: number;
  /** Field to sort by. */
  sortBy?: string;
  /** Sort direction. */
  sortOrder: 'asc' | 'desc';
}>;

/** Offset-based pagination input. */
export type OffsetPaginationInput = Readonly<{
  /** Number of items to skip. */
  offset: number;
  /** Items per page. */
  limit: number;
  /** Field to sort by. */
  sortBy?: string;
  /** Sort direction. */
  sortOrder: 'asc' | 'desc';
}>;

/** Cursor-based pagination input. */
export type CursorPaginationInput = Readonly<{
  /** Cursor for the next page. */
  cursor?: string;
  /** Items per page. */
  limit: number;
  /** Cursor direction. */
  direction: 'forward' | 'backward';
}>;

/** Page-based pagination response metadata. */
export type PaginationOutput = Readonly<{
  /** Current page number. */
  page: number;
  /** Items per page. */
  limit: number;
  /** Total number of items. */
  total: number;
  /** Total number of pages. */
  totalPages: number;
  /** True when another page exists after this page. */
  hasNext: boolean;
  /** True when a previous page exists before this page. */
  hasPrev: boolean;
}>;

/** Cursor pagination response metadata. */
export type CursorPaginationOutput = Readonly<{
  /** Cursor for the next page. */
  nextCursor: string | null;
  /** Cursor for the previous page. */
  prevCursor: string | null;
  /** True when more records are available. */
  hasMore: boolean;
}>;

/**
 * Generic paginated result type.
 */
export interface PaginatedResult<T> {
  /** Page items. */
  data: T[];
  /** Page metadata. */
  pagination: PaginationOutput;
}

/**
 * Generic cursor-paginated result type.
 */
export interface CursorPaginatedResult<T> {
  /** Page items. */
  data: T[];
  /** Cursor metadata. */
  pagination: CursorPaginationOutput;
}
