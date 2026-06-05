/**
 * @test-app/shared - Shared utilities and types
 *
 * Common utilities used across all services and contracts.
 */

export * from './utils/mod.ts';
export {
  baseContract,
  type CursorPaginationMeta,
  CursorPaginationMetaSchema,
  type ForbiddenError,
  ForbiddenErrorSchema,
  type NotFoundError,
  NotFoundErrorSchema,
  type OffsetPaginationMeta,
  OffsetPaginationMetaSchema,
  type PaginationInput,
  PaginationInputSchema,
  type PaginationMeta,
  PaginationMetaSchema,
  type PaginationQuery,
  PaginationQuerySchema,
  type RateLimitError,
  RateLimitErrorSchema,
  type ServiceUnavailableError,
  ServiceUnavailableErrorSchema,
  type SuccessResponse,
  SuccessSchema,
  type UnauthorizedError,
  UnauthorizedErrorSchema,
  type ValidationError,
  ValidationErrorSchema,
} from './contracts.ts';
