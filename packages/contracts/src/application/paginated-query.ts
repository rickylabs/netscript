/**
 * Paginated query helper for Prisma.
 *
 * @example
 * ```typescript
 * import { paginatedQuery } from '@netscript/contracts';
 *
 * const result = await paginatedQuery(db.user, {
 *   page: 1,
 *   limit: 10,
 *   sortBy: 'createdAt',
 *   sortOrder: 'desc',
 *   where: { status: 'active' },
 *   include: { posts: true },
 * });
 *
 * // Result: { data: [...], pagination: { page, limit, total, totalPages, hasNext, hasPrev } }
 * ```
 *
 * @module
 */

import type {
  PaginatedResult,
  PaginationInput,
  PaginationOutput,
} from '../../schemas/pagination.ts';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Prisma model delegate type (simplified).
 * Matches the structure of Prisma's model delegates.
 */
export interface PrismaModelDelegate {
  /** Find many records using Prisma-compatible arguments. */
  findMany: (args?: unknown) => Promise<unknown[]>;
  /** Count records using a Prisma-compatible where clause. */
  count: (args?: { where?: unknown }) => Promise<number>;
}

/**
 * Options for paginated query.
 */
export interface PaginatedQueryOptions extends Partial<PaginationInput> {
  /** Prisma where clause */
  where?: Record<string, unknown>;
  /** Prisma include clause */
  include?: Record<string, unknown>;
  /** Prisma select clause */
  select?: Record<string, unknown>;
}

// ============================================================================
// PAGINATED QUERY
// ============================================================================

/**
 * Executes a paginated query on a Prisma model.
 *
 * @example
 * ```typescript
 * const result = await paginatedQuery(db.user, {
 *   page: 1,
 *   limit: 20,
 *   sortBy: 'name',
 *   sortOrder: 'asc',
 *   where: { role: 'admin' },
 * });
 * ```
 */
export async function paginatedQuery<T>(
  model: PrismaModelDelegate,
  options: PaginatedQueryOptions = {},
): Promise<PaginatedResult<T>> {
  const { page = 1, limit = 10, sortBy, sortOrder = 'desc', where = {}, include, select } = options;

  const skip = (page - 1) * limit;
  const orderBy = sortBy ? { [sortBy]: sortOrder } : { createdAt: sortOrder };

  // Build query args
  // deno-lint-ignore no-explicit-any
  const findManyArgs: Record<string, any> = {
    where,
    orderBy,
    skip,
    take: limit,
  };

  if (include) findManyArgs.include = include;
  if (select) findManyArgs.select = select;

  // Execute queries in parallel
  const [data, total] = await Promise.all([
    model.findMany(findManyArgs),
    model.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  const pagination: PaginationOutput = {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };

  return {
    data: data as T[],
    pagination,
  };
}

// ============================================================================
// OFFSET PAGINATION
// ============================================================================

/**
 * Options for offset-based paginated query.
 */
export interface OffsetPaginatedQueryOptions {
  /** Number of items to skip */
  offset?: number;
  /** Number of items to return */
  limit?: number;
  /** Field to sort by */
  sortBy?: string;
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
  /** Prisma where clause */
  where?: Record<string, unknown>;
  /** Prisma include clause */
  include?: Record<string, unknown>;
  /** Prisma select clause */
  select?: Record<string, unknown>;
}

/**
 * Executes an offset-based paginated query.
 *
 * @example
 * ```typescript
 * const result = await offsetPaginatedQuery(db.user, {
 *   offset: 20,
 *   limit: 10,
 *   where: { role: 'admin' },
 * });
 * ```
 */
export async function offsetPaginatedQuery<T>(
  model: PrismaModelDelegate,
  options: OffsetPaginatedQueryOptions = {},
): Promise<{ data: T[]; total: number; hasMore: boolean }> {
  const { offset = 0, limit = 10, sortBy, sortOrder = 'desc', where = {}, include, select } =
    options;

  const orderBy = sortBy ? { [sortBy]: sortOrder } : { createdAt: sortOrder };

  // deno-lint-ignore no-explicit-any
  const findManyArgs: Record<string, any> = {
    where,
    orderBy,
    skip: offset,
    take: limit,
  };

  if (include) findManyArgs.include = include;
  if (select) findManyArgs.select = select;

  const [data, total] = await Promise.all([
    model.findMany(findManyArgs),
    model.count({ where }),
  ]);

  return {
    data: data as T[],
    total,
    hasMore: offset + limit < total,
  };
}

// ============================================================================
// CURSOR PAGINATION
// ============================================================================

/**
 * Options for cursor-based paginated query.
 */
export interface CursorPaginatedQueryOptions {
  /** Cursor for fetching next page */
  cursor?: string;
  /** Number of items to return */
  limit?: number;
  /** Direction to paginate */
  direction?: 'forward' | 'backward';
  /** Field to use as cursor (default: 'id') */
  cursorField?: string;
  /** Prisma where clause */
  where?: Record<string, unknown>;
  /** Prisma include clause */
  include?: Record<string, unknown>;
  /** Prisma select clause */
  select?: Record<string, unknown>;
}

/**
 * Executes a cursor-based paginated query.
 *
 * @example
 * ```typescript
 * const result = await cursorPaginatedQuery(db.user, {
 *   cursor: 'abc123',
 *   limit: 10,
 *   direction: 'forward',
 * });
 * ```
 */
export async function cursorPaginatedQuery<T extends { id: string | number }>(
  model: PrismaModelDelegate,
  options: CursorPaginatedQueryOptions = {},
): Promise<{ data: T[]; nextCursor: string | null; hasMore: boolean }> {
  const {
    cursor,
    limit = 10,
    direction = 'forward',
    cursorField = 'id',
    where = {},
    include,
    select,
  } = options;

  const orderBy = { [cursorField]: direction === 'forward' ? 'asc' : 'desc' };

  // deno-lint-ignore no-explicit-any
  const findManyArgs: Record<string, any> = {
    where,
    orderBy,
    take: limit + 1, // Fetch one extra to check if there's more
  };

  if (cursor) {
    findManyArgs.cursor = { [cursorField]: cursor };
    findManyArgs.skip = 1; // Skip the cursor item
  }

  if (include) findManyArgs.include = include;
  if (select) findManyArgs.select = select;

  const data = (await model.findMany(findManyArgs)) as T[];

  const hasMore = data.length > limit;
  if (hasMore) {
    data.pop(); // Remove the extra item
  }

  const lastItem = data[data.length - 1];
  const nextCursor = hasMore && lastItem ? String(lastItem.id) : null;

  return {
    data,
    nextCursor,
    hasMore,
  };
}
