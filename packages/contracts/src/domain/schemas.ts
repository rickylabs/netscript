import { z } from 'zod';
import {
  DEFAULT_INTEGER_MAX,
  DEFAULT_PAGINATION_LIMIT,
  DEFAULT_PAGINATION_LIMIT_MAX,
  DEFAULT_PAGINATION_OFFSET,
} from './constants.ts';
import type { ContractObjectSchema, ContractSchema } from './schema-types.ts';

type UntypedZodObjectSchema = ReturnType<typeof z.object>;

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

const notFoundErrorSchema: UntypedZodObjectSchema = z.object({
  resourceType: z.string().describe('Type of resource'),
  resourceId: z.union([z.string(), z.number()]).describe('Resource identifier'),
});

const validationErrorSchema: UntypedZodObjectSchema = z.object({
  formErrors: z.array(z.string()).describe('Form-level errors'),
  fieldErrors: z.record(z.string(), z.array(z.string()).optional()).describe('Field-level errors'),
});

const unauthorizedErrorSchema: UntypedZodObjectSchema = z.object({
  reason: z.enum(['missing_token', 'invalid_token', 'expired_token']).optional(),
});

const forbiddenErrorSchema: UntypedZodObjectSchema = z.object({
  requiredRole: z.string().optional().describe('Required role for this action'),
  userRole: z.string().optional().describe('Current user role'),
});

const rateLimitErrorSchema: UntypedZodObjectSchema = z.object({
  retryAfter: z.number().int().min(1).describe('Seconds to wait before retrying'),
  limit: z.number().int().describe('Rate limit threshold'),
});

const serviceUnavailableErrorSchema: UntypedZodObjectSchema = z.object({
  retryAfter: z.number().int().min(1).optional().describe('Seconds to wait before retrying'),
  reason: z.string().optional().describe('Why the service is unavailable'),
});

/** Offset pagination schema for request bodies. */
export const OffsetPaginationInputSchema: ContractObjectSchema<OffsetPaginationInput> = z.object({
  limit: z.number().int().min(1).max(DEFAULT_PAGINATION_LIMIT_MAX).default(
    DEFAULT_PAGINATION_LIMIT,
  ).describe('Results per page'),
  offset: z.number().int().min(0).max(DEFAULT_INTEGER_MAX).default(
    DEFAULT_PAGINATION_OFFSET,
  ).describe('Offset for pagination'),
}) as unknown as ContractObjectSchema<OffsetPaginationInput>;

/** Offset pagination schema for URL query parameters. */
export const OffsetPaginationQuerySchema: ContractObjectSchema<OffsetPaginationQuery> = z.object({
  limit: z.coerce.number().int().min(1).max(DEFAULT_PAGINATION_LIMIT_MAX).optional().default(
    DEFAULT_PAGINATION_LIMIT,
  ).describe('Results per page'),
  offset: z.coerce.number().int().min(0).max(DEFAULT_INTEGER_MAX).optional().default(
    DEFAULT_PAGINATION_OFFSET,
  ).describe('Offset for pagination'),
}) as unknown as ContractObjectSchema<OffsetPaginationQuery>;

/** Offset pagination metadata schema for responses. */
export const OffsetPaginationMetaSchema: ContractObjectSchema<OffsetPaginationMeta> = z.object({
  total: z.number().int().min(0).max(DEFAULT_INTEGER_MAX).describe('Total count of items'),
  limit: z.number().int().min(1).max(DEFAULT_PAGINATION_LIMIT_MAX).default(
    DEFAULT_PAGINATION_LIMIT,
  ).describe('Results per page'),
  offset: z.number().int().min(0).max(DEFAULT_INTEGER_MAX).default(
    DEFAULT_PAGINATION_OFFSET,
  ).describe('Current offset'),
  hasMore: z.boolean().describe('True if more results are available'),
}) as unknown as ContractObjectSchema<OffsetPaginationMeta>;

/** Cursor pagination schema for request bodies. */
export const CursorPaginationInputSchema: ContractObjectSchema<CursorPaginationInput> = z.object({
  limit: z.number().int().min(1).max(DEFAULT_PAGINATION_LIMIT_MAX).default(
    DEFAULT_PAGINATION_LIMIT,
  ).describe('Results per page'),
  cursor: z.string().optional().describe('Cursor for the next page'),
}) as unknown as ContractObjectSchema<CursorPaginationInput>;

/** Cursor pagination schema for URL query parameters. */
export const CursorPaginationQuerySchema: ContractObjectSchema<CursorPaginationQuery> = z.object({
  limit: z.coerce.number().int().min(1).max(DEFAULT_PAGINATION_LIMIT_MAX).optional().default(
    DEFAULT_PAGINATION_LIMIT,
  ).describe('Results per page'),
  cursor: z.string().optional().describe('Cursor for the next page'),
}) as unknown as ContractObjectSchema<CursorPaginationQuery>;

/** Cursor pagination metadata schema for responses. */
export const CursorPaginationMetaSchema: ContractObjectSchema<CursorPaginationMeta> = z.object({
  limit: z.number().int().min(1).max(DEFAULT_PAGINATION_LIMIT_MAX).default(
    DEFAULT_PAGINATION_LIMIT,
  ).describe('Results per page'),
  nextCursor: z.string().nullable().describe('Cursor for the next page'),
  hasMore: z.boolean().describe('True if more results are available'),
}) as unknown as ContractObjectSchema<CursorPaginationMeta>;

/** Common success response schema. */
export const SuccessSchema: ContractSchema<SuccessResponse> = z.object({
  success: z.boolean().describe('True if the operation completed'),
  message: z.string().optional().describe('Optional success message'),
}) as unknown as ContractSchema<SuccessResponse>;

/** Common not-found error schema. */
export const NotFoundErrorSchema: ContractSchema<NotFoundError> =
  notFoundErrorSchema as unknown as ContractSchema<NotFoundError>;

/** Common validation error schema. */
export const ValidationErrorSchema: ContractSchema<ValidationError> =
  validationErrorSchema as unknown as ContractSchema<ValidationError>;

/** Common rate-limit error schema. */
export const RateLimitErrorSchema: ContractSchema<RateLimitError> =
  rateLimitErrorSchema as unknown as ContractSchema<RateLimitError>;

/** Common unauthorized error schema. */
export const UnauthorizedErrorSchema: ContractSchema<UnauthorizedError> =
  unauthorizedErrorSchema as unknown as ContractSchema<UnauthorizedError>;

/** Common forbidden error schema. */
export const ForbiddenErrorSchema: ContractSchema<ForbiddenError> =
  forbiddenErrorSchema as unknown as ContractSchema<ForbiddenError>;

/** Common service-unavailable error schema. */
export const ServiceUnavailableErrorSchema: ContractSchema<ServiceUnavailableError> =
  serviceUnavailableErrorSchema as unknown as ContractSchema<ServiceUnavailableError>;

export {
  forbiddenErrorSchema,
  notFoundErrorSchema,
  rateLimitErrorSchema,
  serviceUnavailableErrorSchema,
  unauthorizedErrorSchema,
  validationErrorSchema,
};
