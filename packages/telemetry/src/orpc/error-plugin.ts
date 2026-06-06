/**
 * oRPC Error Handling Plugin
 *
 * Provides centralized error handling for all oRPC handlers:
 * - Catches and logs errors with structured context
 * - Transforms errors into proper oRPC error responses
 * - Prevents verbose try-catch blocks in every handler
 *
 * Follows SOLID principles:
 * - Single Responsibility: Only handles error logging/transformation
 * - Open/Closed: Extend via options without modifying plugin code
 * - Dependency Inversion: Uses abstract logger interface
 *
 * @module
 */

import { ORPCError, ValidationError } from '@orpc/contract';
import type { GenericHandlerOptions } from './_types.ts';
import { extractInputKeys } from './_utils.ts';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Log levels supported by the plugin
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Structured error context for logging
 */
export interface ErrorContext {
  /** Full procedure path (e.g., "v1.users.getStats") */
  procedure: string;
  /** Service name */
  service: string;
  /** Input keys (not values for security) */
  inputKeys: string[];
  /** Error code */
  code: string;
  /** HTTP status code if applicable */
  status?: number;
  /** Error message */
  message: string;
  /** Cause */
  cause?: string;
  /** Stack trace (only in development) */
  stack?: string;
  /** Timestamp */
  timestamp: string;
  /** Additional metadata */
  meta?: Record<string, unknown>;
  /** Validation issues from Zod or oRPC validation */
  validationIssues?: unknown;
}

/**
 * Logger interface - allows custom logger injection
 */
export interface ErrorLogger {
  /** Log an error-level context. */
  error(context: ErrorContext): void;
  /** Log a warning-level context. */
  warn?(context: ErrorContext): void;
}

/**
 * Default console logger implementation
 */
const defaultLogger: ErrorLogger = {
  error(ctx: ErrorContext) {
    console.error(JSON.stringify({
      level: 'error',
      service: ctx.service,
      procedure: ctx.procedure,
      code: ctx.code,
      message: ctx.message,
      status: ctx.status,
      inputKeys: ctx.inputKeys,
      timestamp: ctx.timestamp,
      ...(ctx.stack ? { stack: ctx.stack } : {}),
      ...(ctx.meta ? { meta: ctx.meta } : {}),
      ...(ctx.validationIssues ? { validationIssues: ctx.validationIssues } : {}),
    }));
  },
  warn(ctx: ErrorContext) {
    console.warn(JSON.stringify({
      level: 'warn',
      service: ctx.service,
      procedure: ctx.procedure,
      code: ctx.code,
      message: ctx.message,
      timestamp: ctx.timestamp,
    }));
  },
};

/**
 * Error classification for different handling strategies
 */
export type ErrorClassification =
  | 'client' // 4xx - client errors (validation, not found, etc.)
  | 'server' // 5xx - server errors (db failure, unexpected)
  | 'transient'; // Retriable errors (timeout, connection)

/**
 * Error classifier function type
 */
export type ErrorClassifier = (error: Error) => ErrorClassification;

/**
 * Options for the ErrorHandlingPlugin
 */
export interface ErrorHandlingPluginOptions {
  /**
   * Service name for logging context
   */
  serviceName?: string;

  /**
   * Custom logger implementation
   * @default Console logger
   */
  logger?: ErrorLogger;

  /**
   * Whether to include stack traces in logs
   * @default true in development, false in production
   */
  includeStack?: boolean;

  /**
   * Whether to expose internal error details to clients
   * @default false (security best practice)
   */
  exposeInternalErrors?: boolean;

  /**
   * Custom error classifier for categorization
   */
  errorClassifier?: ErrorClassifier;

  /**
   * Error codes that should be logged as warnings instead of errors
   * (e.g., NOT_FOUND, VALIDATION_ERROR)
   */
  warnOnlyCodes?: string[];

  /**
   * Callback for custom error processing (e.g., send to error tracking service)
   */
  onError?: (error: Error, context: ErrorContext) => void | Promise<void>;
}

// ============================================================================
// DEFAULT ERROR CLASSIFIER
// ============================================================================

/**
 * Default error classification based on error code/status
 */
const defaultErrorClassifier: ErrorClassifier = (error: Error): ErrorClassification => {
  const err = error as Error & { code?: string; status?: number };

  // Known client errors
  const clientCodes = [
    'BAD_REQUEST',
    'VALIDATION_ERROR',
    'NOT_FOUND',
    'UNAUTHORIZED',
    'FORBIDDEN',
    'CONFLICT',
    'UNPROCESSABLE_ENTITY',
  ];

  if (err.code && clientCodes.includes(err.code)) {
    return 'client';
  }

  // Check HTTP status
  if (err.status) {
    if (err.status >= 400 && err.status < 500) return 'client';
    if (err.status === 503 || err.status === 504) return 'transient';
  }

  // Transient errors
  const transientPatterns = [
    /timeout/i,
    /ECONNREFUSED/,
    /ECONNRESET/,
    /ETIMEDOUT/,
    /connection.*failed/i,
  ];

  if (transientPatterns.some((p) => p.test(err.message))) {
    return 'transient';
  }

  return 'server';
};

/**
 * Determine if we're in development mode
 */
function isDevelopment(): boolean {
  const env = Deno.env.get('DENO_ENV') || Deno.env.get('NODE_ENV');
  return env !== 'production';
}

/**
 * Transform any error into an ORPCError
 */
function toORPCError(
  error: Error,
  exposeInternal: boolean,
): ORPCError<string, unknown> {
  // Already an ORPCError - return as is
  if (error instanceof ORPCError) {
    return error;
  }

  // Check if it's an error-like object with code/status
  const err = error as Error & {
    code?: string;
    status?: number;
    data?: unknown;
    meta?: Record<string, unknown>;
  };

  // Determine error code
  let code = err.code || 'INTERNAL_SERVER_ERROR';
  let status = err.status || 500;
  let message = error.message;

  // Handle Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaErr = error as Error & { code: string; meta?: Record<string, unknown> };

    switch (prismaErr.code) {
      case 'P2002':
        code = 'CONFLICT';
        status = 409;
        message = 'A record with this value already exists';
        break;
      case 'P2025':
        code = 'NOT_FOUND';
        status = 404;
        message = 'Record not found';
        break;
      case 'P2003':
        code = 'BAD_REQUEST';
        status = 400;
        message = 'Invalid reference - related record does not exist';
        break;
      default:
        code = 'INTERNAL_SERVER_ERROR';
        status = 500;
        message = exposeInternal ? error.message : 'Database operation failed';
    }
  }

  // Don't expose internal error details in production
  if (!exposeInternal && status >= 500) {
    message = 'Internal server error';
  }

  return new ORPCError(code, {
    status,
    message,
    data: err.data,
    cause: err.cause,
  });
}

// ============================================================================
// PLUGIN IMPLEMENTATION
// ============================================================================

/**
 * ErrorHandlingPlugin for oRPC handlers.
 *
 * Provides centralized error handling with:
 * - Structured error logging with context
 * - Error classification (client/server/transient)
 * - Automatic transformation to ORPCError
 * - Prisma error handling
 * - Optional error tracking integration
 *
 * @example
 * ```ts
 * import { ErrorHandlingPlugin } from '@netscript/telemetry/orpc';
 * import { RPCHandler } from '@orpc/server/fetch';
 *
 * const rpcHandler = new RPCHandler(router, {
 *   plugins: [
 *     new ErrorHandlingPlugin({
 *       serviceName: 'users',
 *       warnOnlyCodes: ['NOT_FOUND', 'VALIDATION_ERROR'],
 *     }),
 *   ],
 * });
 * ```
 */
export class ErrorHandlingPlugin {
  private readonly options:
    & Required<
      Omit<ErrorHandlingPluginOptions, 'onError' | 'errorClassifier'>
    >
    & {
      onError?: ErrorHandlingPluginOptions['onError'];
      errorClassifier: ErrorClassifier;
    };

  /**
   * Plugin order - run after tracing plugin to have span context
   */
  order = 900;

  /**
   * Create an oRPC error handling plugin.
   */
  constructor(options: ErrorHandlingPluginOptions = {}) {
    this.options = {
      serviceName: options.serviceName ?? 'unknown',
      logger: options.logger ?? defaultLogger,
      includeStack: options.includeStack ?? isDevelopment(),
      exposeInternalErrors: options.exposeInternalErrors ?? isDevelopment(),
      errorClassifier: options.errorClassifier ?? defaultErrorClassifier,
      warnOnlyCodes: options.warnOnlyCodes ?? ['NOT_FOUND'],
      onError: options.onError,
    };
  }

  /**
   * Initialize the plugin by adding interceptors to the handler options.
   */
  // deno-lint-ignore no-explicit-any -- oRPC does not export the router type consumed by plugin init.
  init(handlerOptions: GenericHandlerOptions, _router?: any): void {
    const {
      serviceName,
      logger,
      includeStack,
      exposeInternalErrors,
      errorClassifier,
      warnOnlyCodes,
      onError,
    } = this.options;

    // Add client interceptor for procedure-level error handling
    handlerOptions.clientInterceptors ??= [];
    // deno-lint-ignore no-explicit-any
    handlerOptions.clientInterceptors.push(async (options: any) => {
      const procedurePath = Array.isArray(options.path)
        ? options.path.join('.')
        : String(options.path);

      try {
        return await options.next();
      } catch (error) {
        const err = error as Error & { code?: string; status?: number; meta?: unknown };

        // Extract validation error details
        const validationIssues = (err.cause as ValidationError)?.issues
          ? [...(err.cause as ValidationError).issues]
          : undefined;

        // Build error context
        const context: ErrorContext = {
          procedure: procedurePath,
          service: serviceName,
          inputKeys: extractInputKeys(options.input, 20),
          code: err.code ?? 'UNKNOWN',
          cause: err.cause as string ?? 'UNKNOWN',
          status: err.status,
          message: err.message,
          timestamp: new Date().toISOString(),
          ...(includeStack && err.stack ? { stack: err.stack } : {}),
          ...(err.meta ? { meta: err.meta as Record<string, unknown> } : {}),
          // Add validation issues to context
          ...(validationIssues ? { validationIssues } : {}),
        };

        // Classify error
        const classification = errorClassifier(err);

        // Log based on classification and warn-only codes
        const isWarnOnly = warnOnlyCodes.includes(context.code);

        if (classification === 'client' && isWarnOnly) {
          logger.warn?.(context);
        } else {
          logger.error(context);
        }

        // Call custom error handler if provided
        if (onError) {
          try {
            await onError(err, context);
          } catch (handlerError) {
            console.error('Error in onError handler:', handlerError);
          }
        }

        // Transform and rethrow as ORPCError
        throw toORPCError(err, exposeInternalErrors);
      }
    });
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create an ErrorHandlingPlugin instance.
 *
 * @param options - Plugin options
 * @returns A new ErrorHandlingPlugin instance
 *
 * @example
 * ```ts
 * const plugin = createErrorHandlingPlugin({
 *   serviceName: 'users',
 *   onError: async (error, ctx) => {
 *     // Send to error tracking service
 *     await Sentry.captureException(error, { extra: ctx });
 *   },
 * });
 * ```
 */
export function createErrorHandlingPlugin(
  options?: ErrorHandlingPluginOptions,
): ErrorHandlingPlugin {
  return new ErrorHandlingPlugin(options);
}
