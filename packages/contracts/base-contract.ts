/**
 * Base contract with shared error definitions.
 *
 * @example
 * ```typescript
 * import { baseContract, notFound, validationError } from '@netscript/contracts';
 *
 * const userContract = baseContract
 *   .route({ method: 'GET', path: '/users/{id}' })
 *   .input(z.object({ id: z.string() }))
 *   .output(UserSchema);
 *
 * // In handler
 * if (!user) {
 *   throw errors.NOT_FOUND(notFound('User', id));
 * }
 * ```
 *
 * @module
 */

import { oc } from '@orpc/contract';
import { z } from 'zod';

// ============================================================================
// ERROR SCHEMAS
// ============================================================================

/**
 * Base error schema with common fields.
 */
export const ErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Not found error schema with resource information.
 */
export const NotFoundErrorSchema = ErrorSchema.extend({
  code: z.literal('NOT_FOUND'),
  resourceType: z.string(),
  resourceId: z.string(),
});

/**
 * Validation error schema with field-level errors.
 */
export const ValidationErrorSchema = ErrorSchema.extend({
  code: z.literal('VALIDATION_ERROR'),
  errors: z.array(
    z.object({
      field: z.string(),
      message: z.string(),
    })
  ),
});

// ============================================================================
// BASE CONTRACT
// ============================================================================

/**
 * Base contract with standard error definitions.
 *
 * All contracts should extend from this to ensure consistent error handling
 * across services.
 *
 * @example
 * ```typescript
 * export const usersContract = {
 *   list: baseContract
 *     .route({ method: 'GET', path: '/users' })
 *     .input(PaginationInputSchema)
 *     .output(UserListSchema),
 *
 *   getById: baseContract
 *     .route({ method: 'GET', path: '/users/{id}' })
 *     .input(z.object({ id: z.string() }))
 *     .output(UserSchema),
 * };
 * ```
 */
export const baseContract = oc.errors({
  NOT_FOUND: {
    status: 404,
    message: 'Resource not found',
    data: NotFoundErrorSchema,
  },
  VALIDATION_ERROR: {
    status: 400,
    message: 'Validation failed',
    data: ValidationErrorSchema,
  },
  UNAUTHORIZED: {
    status: 401,
    message: 'Authentication required',
    data: ErrorSchema.extend({
      code: z.literal('UNAUTHORIZED'),
    }),
  },
  FORBIDDEN: {
    status: 403,
    message: 'Access denied',
    data: ErrorSchema.extend({
      code: z.literal('FORBIDDEN'),
    }),
  },
  CONFLICT: {
    status: 409,
    message: 'Resource conflict',
    data: ErrorSchema.extend({
      code: z.literal('CONFLICT'),
    }),
  },
  INTERNAL_ERROR: {
    status: 500,
    message: 'Internal server error',
    data: ErrorSchema.extend({
      code: z.literal('INTERNAL_ERROR'),
    }),
  },
});

// ============================================================================
// ERROR FACTORY HELPERS
// ============================================================================

/**
 * Creates a NOT_FOUND error payload.
 *
 * @example
 * ```typescript
 * if (!user) {
 *   throw errors.NOT_FOUND(notFound('User', id));
 * }
 * ```
 */
export function notFound(resourceType: string, resourceId: string | number) {
  return {
    code: 'NOT_FOUND' as const,
    message: `${resourceType} with id '${resourceId}' not found`,
    resourceType,
    resourceId: String(resourceId),
  };
}

/**
 * Creates a VALIDATION_ERROR payload.
 *
 * @example
 * ```typescript
 * throw errors.VALIDATION_ERROR(validationError([
 *   { field: 'email', message: 'Invalid email format' },
 * ]));
 * ```
 */
export function validationError(errors: Array<{ field: string; message: string }>) {
  return {
    code: 'VALIDATION_ERROR' as const,
    message: 'Validation failed',
    errors,
  };
}

/**
 * Creates a CONFLICT error payload.
 *
 * @example
 * ```typescript
 * throw errors.CONFLICT(conflict('User with this email already exists'));
 * ```
 */
export function conflict(message: string) {
  return {
    code: 'CONFLICT' as const,
    message,
  };
}

/**
 * Creates an UNAUTHORIZED error payload.
 *
 * @example
 * ```typescript
 * throw errors.UNAUTHORIZED(unauthorized('Invalid credentials'));
 * ```
 */
export function unauthorized(message = 'Authentication required') {
  return {
    code: 'UNAUTHORIZED' as const,
    message,
  };
}

/**
 * Creates a FORBIDDEN error payload.
 *
 * @example
 * ```typescript
 * throw errors.FORBIDDEN(forbidden('Insufficient permissions'));
 * ```
 */
export function forbidden(message = 'Access denied') {
  return {
    code: 'FORBIDDEN' as const,
    message,
  };
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ErrorPayload = z.infer<typeof ErrorSchema>;
export type NotFoundError = z.infer<typeof NotFoundErrorSchema>;
export type ValidationError = z.infer<typeof ValidationErrorSchema>;
