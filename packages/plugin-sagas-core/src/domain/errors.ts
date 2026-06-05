import type { SagasErrorCode } from './constants.ts';

/** Structured error thrown by sagas core APIs. */
export class SagasError extends Error {
  readonly code: SagasErrorCode;
  readonly retryable: boolean;
  override readonly cause?: unknown;

  constructor(message: string, options: SagasErrorOptions) {
    super(message);
    this.name = 'SagasError';
    this.code = options.code;
    this.retryable = options.retryable ?? false;
    this.cause = options.cause;
  }

  /** Create an error for a missing saga definition. */
  static sagaNotFound(id: string): SagasError {
    return new SagasError(`Saga not found: ${id}`, {
      code: 'SAGA_NOT_FOUND',
      retryable: false,
    });
  }

  /** Create an error for a missing saga instance. */
  static sagaInstanceNotFound(id: string): SagasError {
    return new SagasError(`Saga instance not found: ${id}`, {
      code: 'SAGA_INSTANCE_NOT_FOUND',
      retryable: false,
    });
  }

  /** Create an error for invalid saga input or definition state. */
  static validationFailed(message: string, cause?: unknown): SagasError {
    return new SagasError(message, {
      code: 'SAGA_VALIDATION_FAILED',
      retryable: false,
      cause,
    });
  }

  /** Create a retryable runtime error. */
  static retryable(message: string, cause?: unknown): SagasError {
    return new SagasError(message, {
      code: 'SAGA_RETRYABLE',
      retryable: true,
      cause,
    });
  }

  /** Create a non-retryable runtime error. */
  static nonRetryable(message: string, cause?: unknown): SagasError {
    return new SagasError(message, {
      code: 'SAGA_NON_RETRYABLE',
      retryable: false,
      cause,
    });
  }

  /** Create an error for reserved public surface deferred to a later phase. */
  static notImplemented(message: string): SagasError {
    return new SagasError(message, {
      code: 'SAGA_NOT_IMPLEMENTED',
      retryable: false,
    });
  }
}

/** Constructor options for `SagasError`. */
export type SagasErrorOptions = Readonly<{
  code: SagasErrorCode;
  retryable?: boolean;
  cause?: unknown;
}>;
