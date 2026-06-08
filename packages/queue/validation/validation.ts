/**
 * Validation Utilities
 *
 * Helper functions for schema validation in queues.
 *
 * @module
 */

import { QueueValidationError } from '../ports/mod.ts';

/**
 * Minimal schema contract supported by queue validation helpers.
 *
 * Compatible with Zod and other schema libraries that expose `parse()` and
 * `safeParse()` with the same result semantics.
 *
 * @template T - Parsed message type
 */
export interface ValidationSchema<T> {
  /**
   * Parse and return the validated value or throw on failure.
   *
   * @param input - Value to validate
   * @returns Parsed value
   */
  parse(input: unknown): T;

  /**
   * Parse and return a structured success/failure result without throwing.
   *
   * @param input - Value to validate
   * @returns Safe parse result
   */
  safeParse(input: unknown):
    | { success: true; data: T }
    | { success: false; error: { message: string } };
}

/**
 * Validation result for safe parsing.
 */
export interface ValidationResult<T> {
  /**
   * Whether validation succeeded.
   */
  success: boolean;
  /**
   * Parsed data when validation succeeds.
   */
  data?: T;
  /**
   * Validation error message when validation fails.
   */
  error?: string;
}

/**
 * Safely validate a message against a Zod schema.
 * Returns a result object instead of throwing.
 *
 * @param schema - Zod schema to validate against
 * @param message - Message to validate
 * @returns Validation result
 *
 * @example
 * ```ts
 * const result = safeValidate(MessageSchema, message);
 * if (result.success) {
 *   console.log('Valid:', result.data);
 * } else {
 *   console.error('Invalid:', result.error);
 * }
 * ```
 */
export function safeValidate<T>(
  schema: ValidationSchema<T>,
  message: unknown,
): ValidationResult<T> {
  const result = schema.safeParse(message);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  return {
    success: false,
    error: result.error.message,
  };
}

/**
 * Validate a message and throw QueueValidationError if invalid.
 *
 * @param schema - Zod schema to validate against
 * @param message - Message to validate
 * @param context - Additional context for error
 * @returns Validated message
 * @throws {QueueValidationError} If validation fails
 *
 * @example
 * ```ts
 * const validated = validateOrThrow(MessageSchema, message, {
 *   queueName: 'notifications',
 * });
 * ```
 */
export function validateOrThrow<T>(
  schema: ValidationSchema<T>,
  message: unknown,
  context?: Record<string, unknown>,
): T {
  const result = schema.safeParse(message);

  if (result.success) {
    return result.data;
  }

  throw new QueueValidationError(
    `Message validation failed: ${result.error.message}`,
    {
      ...context,
      message,
      error: result.error.message,
    },
  );
}

/**
 * Create a validation middleware for queue handlers.
 * Validates messages before passing to the handler.
 *
 * @param schema - Zod schema to validate against
 * @param handler - Handler function to wrap
 * @returns Wrapped handler with validation
 *
 * @example
 * ```ts
 * const validatedHandler = withValidation(
 *   MessageSchema,
 *   async (message) => {
 *     // message is validated and typed
 *     await processMessage(message);
 *   }
 * );
 *
 * await queue.listen(validatedHandler);
 * ```
 */
export function withValidation<T>(
  schema: ValidationSchema<T>,
  handler: (message: T) => Promise<void>,
): (message: unknown) => Promise<void> {
  return async (message: unknown) => {
    const validated = validateOrThrow(schema, message);
    await handler(validated);
  };
}
