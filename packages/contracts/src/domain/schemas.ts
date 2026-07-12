import { z } from 'zod';
import {
  DEFAULT_INTEGER_MAX,
  DEFAULT_PAGINATION_LIMIT,
  DEFAULT_PAGINATION_LIMIT_MAX,
  DEFAULT_PAGINATION_OFFSET,
} from './constants.ts';
import type { ContractObjectSchema, ContractSchema } from './schema-types.ts';

/** Offset-based pagination input for request bodies. */
export type OffsetPaginationInput = Readonly<{
  limit: number;
  offset: number;
}>;

/** Offset-based pagination input for query parameters. */
export type OffsetPaginationQuery = Readonly<{
  limit: number;
  offset: number;
}>;

/** Offset-based pagination response metadata. */
export type OffsetPaginationMeta = Readonly<{
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}>;

/** Cursor-based pagination input for request bodies. */
export type CursorPaginationInput = Readonly<{
  limit: number;
  cursor?: string;
}>;

/** Cursor-based pagination input for query parameters. */
export type CursorPaginationQuery = Readonly<{
  limit: number;
  cursor?: string;
}>;

/** Cursor-based pagination response metadata. */
export type CursorPaginationMeta = Readonly<{
  limit: number;
  nextCursor: string | null;
  hasMore: boolean;
}>;

/** Common success response envelope. */
export type SuccessResponse = Readonly<{
  success: boolean;
  message?: string;
}>;

/** Error data for missing resources. */
export type NotFoundError = Readonly<{
  resourceType: string;
  resourceId: string | number;
}>;

/** Error data for validation failures. */
export type ValidationError = Readonly<{
  formErrors: string[];
  fieldErrors: Record<string, string[] | undefined>;
}>;

/** Error data for rate-limit failures. */
export type RateLimitError = Readonly<{
  retryAfter: number;
  limit: number;
}>;

/** Error data for authentication failures. */
export type UnauthorizedError = Readonly<{
  reason?: 'missing_token' | 'invalid_token' | 'expired_token';
}>;

/** Error data for authorization failures. */
export type ForbiddenError = Readonly<{
  requiredRole?: string;
  userRole?: string;
}>;

/** Error data for temporarily unavailable services. */
export type ServiceUnavailableError = Readonly<{
  retryAfter?: number;
  reason?: string;
}>;

const notFoundErrorSchema: ContractObjectSchema<NotFoundError, NotFoundError> = z.object({
  resourceType: z.string().describe('Type of resource'),
  resourceId: z.union([z.string(), z.number()]).describe('Resource identifier'),
});

const validationErrorSchema: ContractObjectSchema<ValidationError, ValidationError> = z.object({
  formErrors: z.array(z.string()).describe('Form-level errors'),
  fieldErrors: z.record(z.string(), z.array(z.string()).optional()).describe('Field-level errors'),
});

const unauthorizedErrorSchema: ContractObjectSchema<UnauthorizedError, UnauthorizedError> = z
  .object({
    reason: z.enum(['missing_token', 'invalid_token', 'expired_token']).optional(),
  });

const forbiddenErrorSchema: ContractObjectSchema<ForbiddenError, ForbiddenError> = z.object({
  requiredRole: z.string().optional().describe('Required role for this action'),
  userRole: z.string().optional().describe('Current user role'),
});

const rateLimitErrorSchema: ContractObjectSchema<RateLimitError, RateLimitError> = z.object({
  retryAfter: z.number().int().min(1).describe('Seconds to wait before retrying'),
  limit: z.number().int().describe('Rate limit threshold'),
});

const serviceUnavailableErrorSchema: ContractObjectSchema<
  ServiceUnavailableError,
  ServiceUnavailableError
> = z.object({
  retryAfter: z.number().int().min(1).optional().describe('Seconds to wait before retrying'),
  reason: z.string().optional().describe('Why the service is unavailable'),
});

/** Offset pagination schema for request bodies. */
export const OffsetPaginationInputSchema: ContractObjectSchema<
  OffsetPaginationInput,
  Readonly<{ limit?: number; offset?: number }>
> = z.object({
  limit: z.number().int().min(1).max(DEFAULT_PAGINATION_LIMIT_MAX).default(
    DEFAULT_PAGINATION_LIMIT,
  ).describe('Results per page'),
  offset: z.number().int().min(0).max(DEFAULT_INTEGER_MAX).default(
    DEFAULT_PAGINATION_OFFSET,
  ).describe('Offset for pagination'),
});

/** Offset pagination schema for URL query parameters. */
export const OffsetPaginationQuerySchema: ContractObjectSchema<
  OffsetPaginationQuery,
  Readonly<{ limit?: unknown; offset?: unknown }>
> = z.object({
  limit: z.coerce.number().int().min(1).max(DEFAULT_PAGINATION_LIMIT_MAX).optional().default(
    DEFAULT_PAGINATION_LIMIT,
  ).describe('Results per page'),
  offset: z.coerce.number().int().min(0).max(DEFAULT_INTEGER_MAX).optional().default(
    DEFAULT_PAGINATION_OFFSET,
  ).describe('Offset for pagination'),
});

/** Offset pagination metadata schema for responses. */
export const OffsetPaginationMetaSchema: ContractObjectSchema<
  OffsetPaginationMeta,
  Readonly<{ total: number; limit?: number; offset?: number; hasMore: boolean }>
> = z.object({
  total: z.number().int().min(0).max(DEFAULT_INTEGER_MAX).describe('Total count of items'),
  limit: z.number().int().min(1).max(DEFAULT_PAGINATION_LIMIT_MAX).default(
    DEFAULT_PAGINATION_LIMIT,
  ).describe('Results per page'),
  offset: z.number().int().min(0).max(DEFAULT_INTEGER_MAX).default(
    DEFAULT_PAGINATION_OFFSET,
  ).describe('Current offset'),
  hasMore: z.boolean().describe('True if more results are available'),
});

/** Cursor pagination schema for request bodies. */
export const CursorPaginationInputSchema: ContractObjectSchema<
  CursorPaginationInput,
  Readonly<{ limit?: number; cursor?: string }>
> = z.object({
  limit: z.number().int().min(1).max(DEFAULT_PAGINATION_LIMIT_MAX).default(
    DEFAULT_PAGINATION_LIMIT,
  ).describe('Results per page'),
  cursor: z.string().optional().describe('Cursor for the next page'),
});

/** Cursor pagination schema for URL query parameters. */
export const CursorPaginationQuerySchema: ContractObjectSchema<
  CursorPaginationQuery,
  Readonly<{ limit?: unknown; cursor?: string }>
> = z.object({
  limit: z.coerce.number().int().min(1).max(DEFAULT_PAGINATION_LIMIT_MAX).optional().default(
    DEFAULT_PAGINATION_LIMIT,
  ).describe('Results per page'),
  cursor: z.string().optional().describe('Cursor for the next page'),
});

/** Cursor pagination metadata schema for responses. */
export const CursorPaginationMetaSchema: ContractObjectSchema<
  CursorPaginationMeta,
  Readonly<{ limit?: number; nextCursor: string | null; hasMore: boolean }>
> = z.object({
  limit: z.number().int().min(1).max(DEFAULT_PAGINATION_LIMIT_MAX).default(
    DEFAULT_PAGINATION_LIMIT,
  ).describe('Results per page'),
  nextCursor: z.string().nullable().describe('Cursor for the next page'),
  hasMore: z.boolean().describe('True if more results are available'),
});

/** Common success response schema. */
export const SuccessSchema: ContractSchema<SuccessResponse, SuccessResponse> = z.object({
  success: z.boolean().describe('True if the operation completed'),
  message: z.string().optional().describe('Optional success message'),
});

/** Common not-found error schema. */
export const NotFoundErrorSchema: ContractSchema<NotFoundError, NotFoundError> =
  notFoundErrorSchema;

/** Common validation error schema. */
export const ValidationErrorSchema: ContractSchema<ValidationError, ValidationError> =
  validationErrorSchema;

/** Common rate-limit error schema. */
export const RateLimitErrorSchema: ContractSchema<RateLimitError, RateLimitError> =
  rateLimitErrorSchema;

/** Common unauthorized error schema. */
export const UnauthorizedErrorSchema: ContractSchema<UnauthorizedError, UnauthorizedError> =
  unauthorizedErrorSchema;

/** Common forbidden error schema. */
export const ForbiddenErrorSchema: ContractSchema<ForbiddenError, ForbiddenError> =
  forbiddenErrorSchema;

/** Common service-unavailable error schema. */
export const ServiceUnavailableErrorSchema: ContractSchema<
  ServiceUnavailableError,
  ServiceUnavailableError
> = serviceUnavailableErrorSchema;

export {
  forbiddenErrorSchema,
  notFoundErrorSchema,
  rateLimitErrorSchema,
  serviceUnavailableErrorSchema,
  unauthorizedErrorSchema,
  validationErrorSchema,
};
