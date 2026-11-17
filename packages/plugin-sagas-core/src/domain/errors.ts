import type { SagasErrorCode } from './constants.ts';

/** Structured error thrown by sagas core APIs. */
export class SagasError extends Error {
  /** Stable saga error code used by callers and telemetry. */
  readonly code: SagasErrorCode;
  /** Whether the runtime may retry the failed operation. */
  readonly retryable: boolean;
  /** Original error or contextual cause captured at the boundary. */
  override readonly cause?: unknown;

  /** Create a structured saga error. */
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

/** Why an event subscription cannot continue from its requested cursor. */
export type SagaEventFeedFailure = 'invalid-cursor' | 'history-lost' | 'unavailable';

/** Context for a failed event append or subscription. */
export type SagaEventFeedErrorOptions = Readonly<{
  /** Stable classification for presentation and recovery. */
  reason: SagaEventFeedFailure;
  /** Oldest retained event id, when history is available. */
  oldestId?: string;
  /** Latest committed event id, when history is available. */
  latestId?: string;
  /** Original backend failure, if any. */
  cause?: unknown;
}>;

/** A cursor gap, invalid cursor, or unavailable saga observation journal. */
export class SagaEventFeedError extends SagasError {
  /** Stable classification; history loss requires a fresh application snapshot. */
  readonly reason: SagaEventFeedFailure;
  /** Oldest retained event id, when known. */
  readonly oldestId?: string;
  /** Latest committed event id, when known. */
  readonly latestId?: string;

  /** Create an error without conflating a replay gap with malformed input. */
  constructor(message: string, options: SagaEventFeedErrorOptions) {
    super(message, {
      code: options.reason === 'unavailable' ? 'SAGA_RETRYABLE' : 'SAGA_VALIDATION_FAILED',
      retryable: options.reason === 'unavailable',
      cause: options.cause,
    });
    this.name = 'SagaEventFeedError';
    this.reason = options.reason;
    this.oldestId = options.oldestId;
    this.latestId = options.latestId;
  }
}
