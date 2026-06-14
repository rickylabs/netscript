/**
 * Pagination utilities for `@netscript/fresh/form`.
 *
 * These helpers preserve the current public pagination API that was previously
 * exported from the monolithic form module.
 *
 * @module
 */

/** Parsed pagination input derived from URLSearchParams. */
export interface PaginationInput {
  /** Current page number starting at 1. */
  page: number;
  /** Page size used for the query. */
  limit: number;
  /** Zero-based offset derived from the page and limit. */
  offset: number;
}

/** Full pagination state including total count and original search params. */
export interface PaginationState extends PaginationInput {
  /** Total number of items reported by the query. */
  total: number;
  /** Whether another page is available after the current one. */
  hasMore: boolean;
  /** Original search params used to derive the pagination state. */
  searchParams: URLSearchParams;
}

function parseInteger(value: string | null, fallback: number, minimum: number): number {
  const parsed = Number.parseInt(value ?? '', 10);

  if (Number.isNaN(parsed) || parsed < minimum) {
    return fallback;
  }

  return parsed;
}

/**
 * Resolve pagination input from URLSearchParams.
 *
 * Supports both `page`-based and `offset`-based pagination:
 * - If `page` is present, computes `offset` from `(page - 1) * limit`
 * - Otherwise reads `offset` directly and computes `page`
 */
export function resolvePagination(
  searchParams: URLSearchParams,
  defaultLimit: number,
): PaginationInput {
  const limit = parseInteger(searchParams.get('limit'), defaultLimit, 1);
  const pageParam = searchParams.get('page');
  const offsetParam = searchParams.get('offset');

  if (pageParam) {
    const page = parseInteger(pageParam, 1, 1);

    return {
      page,
      limit,
      offset: (page - 1) * limit,
    };
  }

  const offset = parseInteger(offsetParam, 0, 0);

  return {
    page: Math.floor(offset / limit) + 1,
    limit,
    offset,
  };
}

/**
 * Build a complete pagination state from URLSearchParams and query results.
 */
export function buildPaginationState(
  searchParams: URLSearchParams,
  total: number,
  hasMore: boolean,
  defaultLimit: number,
): PaginationState {
  return {
    ...resolvePagination(searchParams, defaultLimit),
    total,
    hasMore,
    searchParams,
  };
}
