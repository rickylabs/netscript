import type { TriggerId } from './ids.ts';
import type { TriggersErrorCode } from './constants.ts';

/** Constructor options for `TriggersError`. */
export type TriggersErrorOptions = Readonly<{
  code: TriggersErrorCode;
  retryable?: boolean;
  cause?: unknown;
}>;

/** Structured error thrown by trigger core APIs. */
export class TriggersError extends Error {
  /** Stable machine-readable error code. */
  readonly code: TriggersErrorCode;

  /** Whether the runtime may retry the failed operation. */
  readonly retryable: boolean;

  /** Original cause preserved across runtime boundaries. */
  override readonly cause?: unknown;

  /** Create a structured trigger error. */
  constructor(message: string, options: TriggersErrorOptions) {
    super(message);
    this.name = 'TriggersError';
    this.code = options.code;
    this.retryable = options.retryable ?? false;
    this.cause = options.cause;
  }

  /** Create an error for a missing trigger definition. */
  static triggerNotFound(id: TriggerId | string): TriggerNotFoundError {
    return new TriggerNotFoundError(id);
  }

  /** Create an error for a missing trigger event. */
  static triggerEventNotFound(id: string): TriggersError {
    return new TriggersError(`Trigger event not found: ${id}`, {
      code: 'TRIGGER_EVENT_NOT_FOUND',
      retryable: false,
    });
  }

  /** Create an error for invalid trigger input or definition state. */
  static validationFailed(message: string, cause?: unknown): TriggersError {
    return new TriggersError(message, {
      code: 'TRIGGER_VALIDATION_FAILED',
      retryable: false,
      cause,
    });
  }

  /** Create an error for an event skipped by the idempotency layer. */
  static deduplicated(idempotencyKey: string): TriggerDeduplicatedError {
    return new TriggerDeduplicatedError(idempotencyKey);
  }

  /** Create an error for a reserved trigger kind whose runtime is deferred. */
  static kindNotImplemented(kind: string): TriggerKindNotImplementedError {
    return new TriggerKindNotImplementedError(kind);
  }

  /** Create an error for a declared operation unsupported by the selected adapter. */
  static unsupportedOperation(operation: string, message?: string): UnsupportedOperationError {
    return new UnsupportedOperationError(operation, message);
  }

  /** Create a retryable runtime error. */
  static retryable(message: string, cause?: unknown): TriggersError {
    return new TriggersError(message, {
      code: 'TRIGGER_RETRYABLE',
      retryable: true,
      cause,
    });
  }

  /** Create a non-retryable runtime error. */
  static nonRetryable(message: string, cause?: unknown): TriggersError {
    return new TriggersError(message, {
      code: 'TRIGGER_NON_RETRYABLE',
      retryable: false,
      cause,
    });
  }
}

/** Error for a missing trigger definition. */
export class TriggerNotFoundError extends TriggersError {
  /** Trigger identifier that was requested. */
  readonly triggerId: string;

  /** Create an error for a missing trigger definition. */
  constructor(id: TriggerId | string) {
    super(`Trigger not found: ${id}`, {
      code: 'TRIGGER_NOT_FOUND',
      retryable: false,
    });
    this.name = 'TriggerNotFoundError';
    this.triggerId = id;
  }
}

/** Error for an event skipped by the idempotency layer. */
export class TriggerDeduplicatedError extends TriggersError {
  /** Idempotency key that was already applied. */
  readonly idempotencyKey: string;

  /** Create an error for a duplicate idempotency key. */
  constructor(idempotencyKey: string) {
    super(`Trigger event deduplicated: ${idempotencyKey}`, {
      code: 'TRIGGER_DEDUPLICATED',
      retryable: false,
    });
    this.name = 'TriggerDeduplicatedError';
    this.idempotencyKey = idempotencyKey;
  }
}

/** Error for reserved trigger kinds whose runtime ships in a later group. */
export class TriggerKindNotImplementedError extends TriggersError {
  /** Reserved trigger kind that cannot execute yet. */
  readonly kind: string;

  /** Create an error for a reserved trigger kind. */
  constructor(kind: string) {
    super(`Trigger kind is reserved but not implemented: ${kind}`, {
      code: 'TRIGGER_KIND_NOT_IMPLEMENTED',
      retryable: false,
    });
    this.name = 'TriggerKindNotImplementedError';
    this.kind = kind;
  }
}

/** Error for an operation the selected adapter cannot provide. */
export class UnsupportedOperationError extends TriggersError {
  /** Operation name requested by the caller. */
  readonly operation: string;

  /** Create an error for an unsupported trigger operation. */
  constructor(operation: string, message: string = `Unsupported trigger operation: ${operation}`) {
    super(message, {
      code: 'TRIGGER_UNSUPPORTED_OPERATION',
      retryable: false,
    });
    this.name = 'UnsupportedOperationError';
    this.operation = operation;
  }
}
