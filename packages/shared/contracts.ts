/**
 * Shared schemas used across all contracts.
 *
 * These are common patterns that every service and package contract can use.
 *
 * @module
 */

import { os } from '@orpc/server';
import { z } from 'zod';
import {
  nonNegativeInt,
  paginationLimit,
  paginationOffset,
  positiveInt,
  stringToInt,
  stringToNumber,
} from './utils/mod.ts';

// ============================================================================
// PAGINATION
// ============================================================================

/**
 * Offset-based pagination input for request bodies.
 */
export const OffsetPaginationInputSchema = z.object({
  limit: paginationLimit({ description: 'Results per page' }),
  offset: paginationOffset({ description: 'Offset for pagination' }),
});

/**
 * Offset-based pagination input for query parameters.
 *
 * Uses codecs to coerce string query params to numbers.
 */
export const OffsetPaginationQuerySchema = z.object({
  limit: stringToInt(paginationLimit({ description: 'Results per page' })),
  offset: stringToInt(paginationOffset({ description: 'Offset for pagination' })),
});

/**
 * Offset-based pagination metadata.
 */
export const OffsetPaginationMetaSchema = z.object({
  total: nonNegativeInt({ description: 'Total count of items' }),
  limit: paginationLimit({ description: 'Results per page' }),
  offset: paginationOffset({ description: 'Current offset' }),
  hasMore: z.boolean().describe('True if more results available'),
});

/**
 * Cursor-based pagination input for request bodies.
 */
export const CursorPaginationInputSchema = z.object({
  limit: paginationLimit({ description: 'Results per page' }),
  cursor: z.string().optional().describe('Cursor for next page (opaque token)'),
});

/**
 * Cursor-based pagination input for query parameters.
 *
 * Uses codecs to coerce string query params to numbers.
 */
export const CursorPaginationQuerySchema = z.object({
  limit: stringToInt(paginationLimit({ description: 'Results per page' })),
  cursor: z.string().optional().describe('Cursor for next page (opaque token)'),
});

/**
 * Cursor-based pagination metadata.
 */
export const CursorPaginationMetaSchema = z.object({
  limit: paginationLimit({ description: 'Results per page' }),
  nextCursor: z.string().nullable().describe('Cursor for next page (null if no more)'),
  hasMore: z.boolean().describe('True if more results available'),
});

// Backward compatibility aliases.
export const PaginationInputSchema = OffsetPaginationInputSchema;
export const PaginationQuerySchema = OffsetPaginationQuerySchema;
export const PaginationMetaSchema = OffsetPaginationMetaSchema;

// ============================================================================
// ERROR HANDLING - oRPC Type-Safe Errors
// ============================================================================

/**
 * Resource not found (404).
 */
export const NotFoundErrorSchema = z.object({
  resourceType: z.string().describe('Type of resource (e.g., "user", "product")'),
  resourceId: z.union([z.string(), z.number()]).describe('ID of the resource'),
});

/**
 * Validation error (422).
 */
export const ValidationErrorSchema = z.object({
  formErrors: z.array(z.string()).describe('Form-level errors'),
  fieldErrors: z.record(z.string(), z.array(z.string()).optional()).describe('Field-level errors'),
});

/**
 * Rate limit error (429).
 */
export const RateLimitErrorSchema = z.object({
  retryAfter: z.number().int().min(1).describe('Seconds to wait before retrying'),
  limit: z.number().int().describe('Rate limit threshold'),
});

/**
 * Unauthorized error (401).
 */
export const UnauthorizedErrorSchema = z.object({
  reason: z.enum(['missing_token', 'invalid_token', 'expired_token']).optional(),
});

/**
 * Forbidden error (403).
 */
export const ForbiddenErrorSchema = z.object({
  requiredRole: z.string().optional().describe('Required role for this action'),
  userRole: z.string().optional().describe('Current user role'),
});

/**
 * Service unavailable error (503).
 */
export const ServiceUnavailableErrorSchema = z.object({
  retryAfter: z.number().int().min(1).optional().describe('Seconds to wait before retrying'),
  reason: z.string().optional().describe('Why service is unavailable'),
});

// ============================================================================
// COMMON RESPONSES
// ============================================================================

export const SuccessSchema = z.object({
  success: z.boolean().describe('True if operation successful'),
  message: z.string().optional().describe('Optional success message'),
});

export const IdParamSchema = z.object({
  id: positiveInt({ description: 'Resource ID' }),
});

/**
 * ID parameter schema for query parameters.
 *
 * Uses codec to coerce string query param to number.
 */
export const IdQuerySchema = z.object({
  id: stringToInt(positiveInt({ description: 'Resource ID' })),
});

// ============================================================================
// BASE CONTRACT WITH COMMON ERRORS
// ============================================================================

/**
 * Base contract with common error definitions.
 *
 * All service contracts should extend this.
 *
 * @example
 * ```ts
 * const usersContract = baseContract.errors({
 *   USER_ALREADY_EXISTS: { status: 409, data: z.object({ email: z.string() }) },
 * });
 * ```
 */
export const baseContract = os.errors({
  NOT_FOUND: {
    status: 404,
    message: 'Resource not found',
    data: NotFoundErrorSchema,
  },
  VALIDATION_ERROR: {
    status: 422,
    message: 'Validation failed',
    data: ValidationErrorSchema,
  },
  UNAUTHORIZED: {
    status: 401,
    message: 'Authentication required',
    data: UnauthorizedErrorSchema,
  },
  FORBIDDEN: {
    status: 403,
    message: 'Access denied',
    data: ForbiddenErrorSchema,
  },
  RATE_LIMITED: {
    status: 429,
    message: 'Too many requests',
    data: RateLimitErrorSchema,
  },
  SERVICE_UNAVAILABLE: {
    status: 503,
    message: 'Service temporarily unavailable',
    data: ServiceUnavailableErrorSchema,
  },
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type OffsetPaginationInput = z.infer<typeof OffsetPaginationInputSchema>;
export type OffsetPaginationQuery = z.output<typeof OffsetPaginationQuerySchema>;
export type OffsetPaginationMeta = z.infer<typeof OffsetPaginationMetaSchema>;
export type CursorPaginationInput = z.infer<typeof CursorPaginationInputSchema>;
export type CursorPaginationQuery = z.output<typeof CursorPaginationQuerySchema>;
export type CursorPaginationMeta = z.infer<typeof CursorPaginationMetaSchema>;
export type PaginationInput = z.infer<typeof PaginationInputSchema>;
export type PaginationQuery = z.output<typeof PaginationQuerySchema>;
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;
export type SuccessResponse = z.infer<typeof SuccessSchema>;
export type IdParam = z.infer<typeof IdParamSchema>;
export type IdQuery = z.output<typeof IdQuerySchema>;
export type NotFoundError = z.infer<typeof NotFoundErrorSchema>;
export type ValidationError = z.infer<typeof ValidationErrorSchema>;
export type RateLimitError = z.infer<typeof RateLimitErrorSchema>;
export type UnauthorizedError = z.infer<typeof UnauthorizedErrorSchema>;
export type ForbiddenError = z.infer<typeof ForbiddenErrorSchema>;
export type ServiceUnavailableError = z.infer<typeof ServiceUnavailableErrorSchema>;
