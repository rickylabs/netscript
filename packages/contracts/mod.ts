/**
 * @netscript/contracts
 *
 * Contract utilities, shared schemas, and CRUD helpers for building
 * type-safe APIs with oRPC.
 *
 * @example
 * ```typescript
 * import {
 *   baseContract,
 *   createCrudContract,
 *   paginatedQuery,
 *   notFound,
 * } from '@netscript/contracts';
 *
 * // Create CRUD contract
 * const usersContract = createCrudContract({
 *   resource: 'users',
 *   entitySchema: UserSchema,
 *   createSchema: CreateUserSchema,
 *   updateSchema: UpdateUserSchema.partial(),
 * });
 *
 * // Implement handler with pagination
 * const list = usersContract.list.handler(async ({ input }) => {
 *   return await paginatedQuery(db.user, input);
 * });
 *
 * // Use error helpers
 * const getById = usersContract.getById.handler(async ({ input, errors }) => {
 *   const user = await db.user.findUnique({ where: { id: input.id } });
 *   if (!user) throw errors.NOT_FOUND(notFound('User', input.id));
 *   return user;
 * });
 * ```
 *
 * @module
 */

import { oc } from '@orpc/contract';
import { z } from 'zod';

// ============================================================================
// BASE CONTRACT & ERRORS
// ============================================================================

export {
  baseContract,
  notFound,
  validationError,
  conflict,
  unauthorized,
  forbidden,
  ErrorSchema,
  NotFoundErrorSchema,
  ValidationErrorSchema,
  type ErrorPayload,
  type NotFoundError,
  type ValidationError,
} from './base-contract.ts';

// ============================================================================
// PAGINATION SCHEMAS
// ============================================================================

export {
  PaginationInputSchema,
  OffsetPaginationInputSchema,
  CursorPaginationInputSchema,
  PaginationOutputSchema,
  CursorPaginationOutputSchema,
  createPaginatedOutput,
  createCursorPaginatedOutput,
  type PaginationInput,
  type OffsetPaginationInput,
  type CursorPaginationInput,
  type PaginationOutput,
  type CursorPaginationOutput,
  type PaginatedResult,
  type CursorPaginatedResult,
} from './schemas/pagination.ts';

// ============================================================================
// FILTER SCHEMAS & HELPERS
// ============================================================================

export {
  FilterOperatorSchema,
  FilterConditionSchema,
  FiltersSchema,
  SearchInputSchema,
  buildPrismaWhere,
  buildSearchCondition,
  combineConditions,
  type FilterOperator,
  type FilterCondition,
  type Filters,
  type SearchInput,
} from './schemas/filters.ts';

// ============================================================================
// CRUD CONTRACT GENERATOR
// ============================================================================

export {
  createCrudContract,
  createReadOnlyContract,
  createListOnlyContract,
  type CrudContractOptions,
  type CrudContract,
} from './crud/create-crud-contract.ts';

// ============================================================================
// QUERY HELPERS
// ============================================================================

export {
  paginatedQuery,
  offsetPaginatedQuery,
  cursorPaginatedQuery,
  type PaginatedQueryOptions,
  type OffsetPaginatedQueryOptions,
  type CursorPaginatedQueryOptions,
} from './helpers/paginated-query.ts';

// ============================================================================
// TRANSFORM HELPERS
// ============================================================================

export {
  createTransformer,
  createPickTransformer,
  createOmitTransformer,
  composeTransformers,
  type TransformFn,
  type Transformer,
} from './helpers/transform.ts';

// ============================================================================
// LEGACY EXPORTS (for backward compatibility)
// ============================================================================

/**
 * Create a new contract using oRPC contract builder
 * @deprecated Use `baseContract` instead for consistent error handling
 */
export function createContract() {
  return oc;
}

/**
 * Validate data against a Zod schema
 */
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Safe parse result type
 */
export type SafeParseResult<T> = { success: true; data: T } | { success: false; error: z.ZodError };

/**
 * Safely validate data against a Zod schema
 */
export function safeValidateSchema<T>(schema: z.ZodSchema<T>, data: unknown): SafeParseResult<T> {
  return schema.safeParse(data);
}

/**
 * Common pagination input schema
 * @deprecated Use `PaginationInputSchema` instead
 */
export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

/**
 * Common ID parameter schema
 */
export const IdParamSchema = z.object({
  id: z.string().uuid(),
});

/**
 * Common timestamp fields schema
 */
export const TimestampSchema = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Pagination = z.infer<typeof PaginationSchema>;
export type IdParam = z.infer<typeof IdParamSchema>;
export type Timestamp = z.infer<typeof TimestampSchema>;

// Re-export zod and orpc for convenience
export { oc, z };
