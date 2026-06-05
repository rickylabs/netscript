/**
 * Queue Error Types
 *
 * Standardized error handling for queue operations.
 *
 * @module
 */

/**
 * Error codes for queue operations.
 */
export enum QueueErrorCode {
  /**
   * Failed to connect to queue backend.
   */
  CONNECTION_FAILED = 'CONNECTION_FAILED',

  /**
   * Failed to enqueue message.
   */
  ENQUEUE_FAILED = 'ENQUEUE_FAILED',

  /**
   * Failed to dequeue message.
   */
  DEQUEUE_FAILED = 'DEQUEUE_FAILED',

  /**
   * Message handler threw an error.
   */
  HANDLER_ERROR = 'HANDLER_ERROR',

  /**
   * Message validation failed (Zod schema).
   */
  VALIDATION_ERROR = 'VALIDATION_ERROR',

  /**
   * Operation timed out.
   */
  TIMEOUT = 'TIMEOUT',

  /**
   * Queue configuration error.
   */
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',

  /**
   * Provider not available or not supported.
   */
  PROVIDER_NOT_AVAILABLE = 'PROVIDER_NOT_AVAILABLE',
}

/**
 * Base error class for all queue operations.
 */
export class QueueError extends Error {
  /**
   * Error code for programmatic error handling.
   */
  public readonly code: QueueErrorCode;

  /**
   * Original error that caused this error (if any).
   */
  public override readonly cause?: Error;

  /**
   * Additional context about the error.
   */
  public readonly context?: Record<string, unknown>;

  /**
   * Create a queue error with a standardized error code.
   *
   * @param message - Human-readable error message
   * @param code - Stable error code for programmatic handling
   * @param options - Optional cause and structured context
   */
  constructor(
    message: string,
    code: QueueErrorCode,
    options?: {
      cause?: Error;
      context?: Record<string, unknown>;
    },
  ) {
    super(message);
    this.name = 'QueueError';
    this.code = code;
    this.cause = options?.cause;
    this.context = options?.context;

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, QueueError);
    }
  }

  /**
   * Convert error to JSON for logging/serialization.
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      cause: this.cause?.message,
      stack: this.stack,
    };
  }
}

/**
 * Error thrown when queue connection fails.
 */
export class QueueConnectionError extends QueueError {
  /**
   * Create a queue connection error.
   *
   * @param message - Human-readable error message
   * @param cause - Original connection failure
   */
  constructor(message: string, cause?: Error) {
    super(message, QueueErrorCode.CONNECTION_FAILED, { cause });
    this.name = 'QueueConnectionError';
  }
}

/**
 * Error thrown when message validation fails.
 */
export class QueueValidationError extends QueueError {
  /**
   * Create a queue validation error.
   *
   * @param message - Human-readable error message
   * @param context - Structured validation details
   */
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, QueueErrorCode.VALIDATION_ERROR, { context });
    this.name = 'QueueValidationError';
  }
}

/**
 * Error thrown when message handler fails.
 */
export class QueueHandlerError extends QueueError {
  /**
   * Create a queue handler error.
   *
   * @param message - Human-readable error message
   * @param cause - Original handler failure
   * @param context - Structured handler context
   */
  constructor(message: string, cause?: Error, context?: Record<string, unknown>) {
    super(message, QueueErrorCode.HANDLER_ERROR, { cause, context });
    this.name = 'QueueHandlerError';
  }
}

/**
 * Error thrown when queue configuration is invalid.
 */
export class QueueConfigurationError extends QueueError {
  /**
   * Create a queue configuration error.
   *
   * @param message - Human-readable error message
   * @param context - Structured configuration details
   */
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, QueueErrorCode.CONFIGURATION_ERROR, { context });
    this.name = 'QueueConfigurationError';
  }
}
