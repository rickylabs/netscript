/** Redacted, bounded command failures; application/business errors remain outside this union. */
export type CommandFailure =
  | Readonly<
    {
      kind: 'invalid_envelope';
      retryable: false;
      reason: 'actor' | 'correlation' | 'idempotency_required' | 'trace_context';
    }
  >
  | Readonly<{ kind: 'optimistic_conflict'; retryable: false }>
  | Readonly<{ kind: 'idempotency_key_reuse'; retryable: false }>
  | Readonly<{ kind: 'in_progress'; retryable: true; retryAfterMs?: number }>
  | Readonly<
    {
      kind: 'unsupported_capability';
      retryable: false;
      capability: 'store_atomicity' | 'isolation' | 'transaction_model';
    }
  >
  | Readonly<
    {
      kind: 'codec_failure';
      retryable: false;
      phase: 'fingerprint' | 'response_encode' | 'response_decode' | 'side_record';
    }
  >
  | Readonly<{ kind: 'receipt_corrupt'; retryable: false }>
  | Readonly<
    {
      kind: 'store_failure';
      retryable: boolean;
      phase: 'begin' | 'claim' | 'business' | 'flush' | 'complete' | 'commit';
    }
  >
  | Readonly<{ kind: 'aborted'; retryable: true }>;

const ENVELOPE_REASONS = ['actor', 'correlation', 'idempotency_required', 'trace_context'];
const CAPABILITIES = ['store_atomicity', 'isolation', 'transaction_model'];
const CODEC_PHASES = ['fingerprint', 'response_encode', 'response_decode', 'side_record'];
const STORE_PHASES = ['begin', 'claim', 'business', 'flush', 'complete', 'commit'];

function normalizedFailure(failure: CommandFailure): CommandFailure {
  if (typeof failure.retryable !== 'boolean') {
    throw new TypeError('[netscript.command.failure] invalid retry policy');
  }
  const retryable = failure.kind === 'in_progress' || failure.kind === 'aborted';
  if (failure.kind !== 'store_failure' && failure.retryable !== retryable) {
    throw new TypeError('[netscript.command.failure] invalid retry policy');
  }
  switch (failure.kind) {
    case 'invalid_envelope':
      if (!ENVELOPE_REASONS.includes(failure.reason)) break;
      return Object.freeze({ kind: failure.kind, retryable: false, reason: failure.reason });
    case 'optimistic_conflict':
    case 'idempotency_key_reuse':
    case 'receipt_corrupt':
      return Object.freeze({ kind: failure.kind, retryable: false });
    case 'in_progress':
      if (
        failure.retryAfterMs !== undefined &&
        (!Number.isSafeInteger(failure.retryAfterMs) || failure.retryAfterMs < 0)
      ) break;
      return Object.freeze({
        kind: failure.kind,
        retryable: true,
        ...(failure.retryAfterMs === undefined ? {} : { retryAfterMs: failure.retryAfterMs }),
      });
    case 'unsupported_capability':
      if (!CAPABILITIES.includes(failure.capability)) break;
      return Object.freeze({
        kind: failure.kind,
        retryable: false,
        capability: failure.capability,
      });
    case 'codec_failure':
      if (!CODEC_PHASES.includes(failure.phase)) break;
      return Object.freeze({ kind: failure.kind, retryable: false, phase: failure.phase });
    case 'store_failure':
      if (!STORE_PHASES.includes(failure.phase)) break;
      return Object.freeze({
        kind: failure.kind,
        retryable: failure.retryable,
        phase: failure.phase,
      });
    case 'aborted':
      return Object.freeze({ kind: failure.kind, retryable: true });
  }
  throw new TypeError('[netscript.command.failure] invalid bounded failure');
}

/**
 * Carry a frozen redacted failure, retaining the trusted cause outside serialized data.
 *
 * @example
 * ```ts
 * import { CommandError } from '@netscript/service/commands';
 * throw new CommandError({ kind: 'optimistic_conflict', retryable: false });
 * ```
 */
export class CommandError extends Error {
  /** Safe typed failure; driver codes, requests and stored response text are excluded. */
  readonly failure: CommandFailure;

  /** Create an immutable error with bounded failure fields and an optional trusted cause. */
  constructor(failure: CommandFailure, options?: ErrorOptions) {
    const normalized = normalizedFailure(failure);
    super(`Command failure: ${normalized.kind}`, options);
    this.name = 'CommandError';
    this.failure = normalized;
    Object.freeze(this);
  }

  /** Serialize only the safe failure vocabulary, never message, stack or cause. */
  toJSON(): CommandFailure {
    return this.failure;
  }
}
