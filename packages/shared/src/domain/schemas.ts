import { z } from 'zod';
import type { SharedObjectSchema, SharedSchema } from './schema-types.ts';

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

/** Offset pagination schema for request bodies. */
export const OffsetPaginationInputSchema: SharedObjectSchema<OffsetPaginationInput> = z.object({
  limit: z.number().int().min(1).max(1_000).default(10).describe('Results per page'),
  offset: z.number().int().min(0).max(2_147_483_647).default(0).describe(
    'Offset for pagination',
  ),
}) as unknown as SharedObjectSchema<OffsetPaginationInput>;

/** Offset pagination schema for URL query parameters. */
export const OffsetPaginationQuerySchema: SharedObjectSchema<OffsetPaginationQuery> = z.object({
  limit: z.coerce.number().int().min(1).max(1_000).optional().default(10).describe(
    'Results per page',
  ),
  offset: z.coerce.number().int().min(0).max(2_147_483_647).optional().default(0).describe(
    'Offset for pagination',
  ),
}) as unknown as SharedObjectSchema<OffsetPaginationQuery>;

/** Offset pagination metadata schema for responses. */
export const OffsetPaginationMetaSchema: SharedObjectSchema<OffsetPaginationMeta> = z.object({
  total: z.number().int().min(0).max(2_147_483_647).describe('Total count of items'),
  limit: z.number().int().min(1).max(1_000).default(10).describe('Results per page'),
  offset: z.number().int().min(0).max(2_147_483_647).default(0).describe('Current offset'),
  hasMore: z.boolean().describe('True if more results are available'),
}) as unknown as SharedObjectSchema<OffsetPaginationMeta>;

/** Cursor pagination schema for request bodies. */
export const CursorPaginationInputSchema: SharedObjectSchema<CursorPaginationInput> = z.object({
  limit: z.number().int().min(1).max(1_000).default(10).describe('Results per page'),
  cursor: z.string().optional().describe('Cursor for the next page'),
}) as unknown as SharedObjectSchema<CursorPaginationInput>;

/** Cursor pagination schema for URL query parameters. */
export const CursorPaginationQuerySchema: SharedObjectSchema<CursorPaginationQuery> = z.object({
  limit: z.coerce.number().int().min(1).max(1_000).optional().default(10).describe(
    'Results per page',
  ),
  cursor: z.string().optional().describe('Cursor for the next page'),
}) as unknown as SharedObjectSchema<CursorPaginationQuery>;

/** Cursor pagination metadata schema for responses. */
export const CursorPaginationMetaSchema: SharedObjectSchema<CursorPaginationMeta> = z.object({
  limit: z.number().int().min(1).max(1_000).default(10).describe('Results per page'),
  nextCursor: z.string().nullable().describe('Cursor for the next page'),
  hasMore: z.boolean().describe('True if more results are available'),
}) as unknown as SharedObjectSchema<CursorPaginationMeta>;

/** Common success response schema. */
export const SuccessSchema: SharedSchema<SuccessResponse> = z.object({
  success: z.boolean().describe('True if the operation completed'),
  message: z.string().optional().describe('Optional success message'),
}) as unknown as SharedSchema<SuccessResponse>;

/** Common not-found error schema. */
export const NotFoundErrorSchema: SharedSchema<NotFoundError> = z.object({
  resourceType: z.string().describe('Type of resource'),
  resourceId: z.union([z.string(), z.number()]).describe('Resource identifier'),
}) as unknown as SharedSchema<NotFoundError>;

/** Common validation error schema. */
export const ValidationErrorSchema: SharedSchema<ValidationError> = z.object({
  formErrors: z.array(z.string()).describe('Form-level errors'),
  fieldErrors: z.record(z.string(), z.array(z.string()).optional()).describe('Field-level errors'),
}) as unknown as SharedSchema<ValidationError>;

/** Common rate-limit error schema. */
export const RateLimitErrorSchema: SharedSchema<RateLimitError> = z.object({
  retryAfter: z.number().int().min(1).describe('Seconds to wait before retrying'),
  limit: z.number().int().describe('Rate limit threshold'),
}) as unknown as SharedSchema<RateLimitError>;

/** Common unauthorized error schema. */
export const UnauthorizedErrorSchema: SharedSchema<UnauthorizedError> = z.object({
  reason: z.enum(['missing_token', 'invalid_token', 'expired_token']).optional(),
}) as unknown as SharedSchema<UnauthorizedError>;

/** Common forbidden error schema. */
export const ForbiddenErrorSchema: SharedSchema<ForbiddenError> = z.object({
  requiredRole: z.string().optional().describe('Required role for this action'),
  userRole: z.string().optional().describe('Current user role'),
}) as unknown as SharedSchema<ForbiddenError>;

/** Common service-unavailable error schema. */
export const ServiceUnavailableErrorSchema: SharedSchema<ServiceUnavailableError> = z.object({
  retryAfter: z.number().int().min(1).optional().describe('Seconds to wait before retrying'),
  reason: z.string().optional().describe('Why the service is unavailable'),
}) as unknown as SharedSchema<ServiceUnavailableError>;
