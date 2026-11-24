/**
 * Bounded transient SQLite contention retry and commit-outcome classification
 * for worker settlement persistence.
 *
 * Retries only failures known to be uncommitted local SQLite lock/busy contention.
 * Refused CAS checks stay conflicts without transient retry. Unknown commit outcomes
 * run read-only state verification before deciding and never trigger a blind replay.
 *
 * @module
 */

import { delay } from '@std/async/delay';

/** Closed classification for failed worker persistence writes. */
export const SETTLEMENT_FAILURE_CLASS = {
  CAS_CONFLICT: 'cas_conflict',
  KNOWN_UNCOMMITTED_TRANSIENT: 'known_uncommitted_transient',
  ABORTED: 'aborted',
  UNKNOWN_COMMIT_OUTCOME: 'unknown_commit_outcome',
} as const;

/** Discriminated classification union for worker persistence failures. */
export type SettlementFailureClass =
  typeof SETTLEMENT_FAILURE_CLASS[keyof typeof SETTLEMENT_FAILURE_CLASS];

/** Bounded retry policy for known-uncommitted local SQLite write contention. */
export interface SettlementRetryPolicy {
  /** Maximum total attempts including the initial attempt (must be >= 1). */
  readonly maxAttempts: number;
  /** Maximum cumulative wall-clock time across attempts and waits in milliseconds. */
  readonly maxTotalTimeMs: number;
  /** Base exponential backoff delay before the first retry in milliseconds. */
  readonly baseDelayMs: number;
  /** Maximum single backoff wait in milliseconds. */
  readonly maxDelayMs: number;
}

/**
 * Locked bounded retry policy matching the queue layer:
 * up to 6 attempts (1 initial + 5 retries) within a 2 s wall-clock ceiling using
 * equal-jitter exponential backoff (15 -> 30 -> 60 -> 120 -> 240 ms, capped at 250 ms).
 */
export const DEFAULT_SETTLEMENT_RETRY_POLICY: SettlementRetryPolicy = Object.freeze({
  maxAttempts: 6,
  maxTotalTimeMs: 2_000,
  baseDelayMs: 15,
  maxDelayMs: 250,
});

/** Result returned by a read-only post-error commit verification callback. */
export type SettlementCommitVerification<T> =
  | Readonly<{ committed: true; value: T }>
  | Readonly<{ committed: false }>;

/** Discriminated outcome of one settlement persistence step. */
export type SettlementOutcome<T> =
  | Readonly<{
    settled: true;
    value: T;
    attempts: number;
    verifiedAfterUnknown: boolean;
  }>
  | Readonly<{
    settled: false;
    failureClass: SettlementFailureClass;
    error: unknown;
    attempts: number;
  }>;

/** Failure branch of {@link SettlementOutcome}. */
export type FailedSettlementOutcome = Extract<
  SettlementOutcome<never>,
  { readonly settled: false }
>;

/** Options for {@link settleWriteWithVerification}. */
export interface SettlementWriteOptions<T> {
  /** Bounded retry policy; defaults to {@link DEFAULT_SETTLEMENT_RETRY_POLICY}. */
  readonly policy?: SettlementRetryPolicy;
  /** Abort signal that cancels retries and backoff waits immediately. */
  readonly signal?: AbortSignal;
  /** Optional read-only state verifier invoked on `unknown_commit_outcome`. */
  readonly verifyCommitted?: () => Promise<SettlementCommitVerification<T>>;
  /** Monotonic millisecond clock override for deterministic tests. */
  readonly now?: () => number;
  /** Random source in `[0, 1)` for backoff jitter. */
  readonly random?: () => number;
  /** Abortable sleep override for deterministic tests. */
  readonly sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
}

const MAX_CAUSE_DEPTH = 8;
const ABORT_ERROR_NAMES = new Set([
  'AbortError',
  'ShutdownError',
  'TimeoutError',
  'QueueLeaseLostError',
]);
const CAS_CONFLICT_PATTERN =
  /\b(?:claim lost|cas\b.*\b(?:refus|conflict|fail)|atomic check(?:s)? (?:refused|failed)|versionstamp (?:mismatch|conflict))\b/i;
const AMBIGUOUS_OR_NON_TRANSIENT_PATTERN =
  /\b(?:ambiguous|uncertain|commit outcome|outcome unknown|after commit|SQLITE_IOERR|SQLITE_CORRUPT|SQLITE_FULL)\b/i;
const SQLITE_TRANSIENT_CODE_PATTERN = /^SQLITE_(?:BUSY|LOCKED)(?:_[A-Z0-9_]+)?$/i;
const SQLITE_TRANSIENT_MESSAGE_PATTERN =
  /\b(?:SQLITE_BUSY(?:_[A-Z0-9_]+)?|SQLITE_LOCKED(?:_[A-Z0-9_]+)?|database is locked|database table is locked|database schema is locked)\b/i;

/**
 * Classify a worker storage write error into the closed commit-outcome taxonomy.
 */
export function classifySettlementWriteFailure(
  error: unknown,
  signal?: AbortSignal,
): SettlementFailureClass {
  const chain = collectErrorChain(error);
  let hasTransientBusy = false;

  for (const item of chain) {
    const name = readStringProperty(item, 'name');
    const code = readStringProperty(item, 'code');
    const message = readErrorMessage(item);

    if (
      name === 'CasConflictError' ||
      code === 'CAS_CONFLICT' ||
      code === 'ATOMIC_CHECK_FAILED' ||
      CAS_CONFLICT_PATTERN.test(message)
    ) {
      return SETTLEMENT_FAILURE_CLASS.CAS_CONFLICT;
    }

    if (
      (name !== undefined && ABORT_ERROR_NAMES.has(name)) ||
      (signal?.aborted && item === signal.reason)
    ) {
      return SETTLEMENT_FAILURE_CLASS.ABORTED;
    }

    if (
      item instanceof Deno.errors.BadResource ||
      name === 'KvClosedError' ||
      AMBIGUOUS_OR_NON_TRANSIENT_PATTERN.test(message)
    ) {
      return SETTLEMENT_FAILURE_CLASS.UNKNOWN_COMMIT_OUTCOME;
    }

    if (
      (code !== undefined && SQLITE_TRANSIENT_CODE_PATTERN.test(code)) ||
      SQLITE_TRANSIENT_MESSAGE_PATTERN.test(message)
    ) {
      hasTransientBusy = true;
    }
  }

  return hasTransientBusy
    ? SETTLEMENT_FAILURE_CLASS.KNOWN_UNCOMMITTED_TRANSIENT
    : SETTLEMENT_FAILURE_CLASS.UNKNOWN_COMMIT_OUTCOME;
}

/**
 * Execute one worker persistence write with bounded retries only for known-uncommitted
 * SQLite busy/locked contention and read-first verification on unknown commit outcomes.
 */
export async function settleWriteWithVerification<T>(
  operation: () => Promise<T>,
  options: SettlementWriteOptions<T> = {},
): Promise<SettlementOutcome<T>> {
  const policy = options.policy ?? DEFAULT_SETTLEMENT_RETRY_POLICY;
  const now = options.now ?? (() => performance.now());
  const random = options.random ?? Math.random;
  const sleep = options.sleep ?? defaultSleep;
  const signal = options.signal;
  const deadline = now() + Math.max(0, policy.maxTotalTimeMs);
  const maxAttempts = Math.max(1, Math.floor(policy.maxAttempts));

  let attempts = 0;
  while (true) {
    if (signal?.aborted) {
      return {
        settled: false,
        failureClass: SETTLEMENT_FAILURE_CLASS.ABORTED,
        error: signal.reason ?? new DOMException('Aborted', 'AbortError'),
        attempts,
      };
    }

    attempts += 1;
    try {
      const value = await operation();
      return { settled: true, value, attempts, verifiedAfterUnknown: false };
    } catch (error) {
      const failureClass = classifySettlementWriteFailure(error, signal);
      if (
        failureClass === SETTLEMENT_FAILURE_CLASS.UNKNOWN_COMMIT_OUTCOME &&
        options.verifyCommitted
      ) {
        try {
          const verified = await options.verifyCommitted();
          if (verified.committed) {
            return {
              settled: true,
              value: verified.value,
              attempts,
              verifiedAfterUnknown: true,
            };
          }
        } catch {
          // Verification could not prove a committed state; preserve the original failure.
        }
        return { settled: false, failureClass, error, attempts };
      }

      if (
        failureClass !== SETTLEMENT_FAILURE_CLASS.KNOWN_UNCOMMITTED_TRANSIENT ||
        attempts >= maxAttempts ||
        signal?.aborted
      ) {
        return { settled: false, failureClass, error, attempts };
      }

      const remainingMs = deadline - now();
      if (remainingMs <= 0) {
        return { settled: false, failureClass, error, attempts };
      }

      const ceiling = Math.min(policy.maxDelayMs, policy.baseDelayMs * 2 ** (attempts - 1));
      if (ceiling > 0) {
        const jitterFactor = Math.min(1, Math.max(0, random()));
        const jittered = Math.max(1, Math.floor(ceiling / 2 + jitterFactor * (ceiling / 2)));
        const waitMs = Math.min(jittered, remainingMs);
        if (waitMs > 0) {
          try {
            await sleep(waitMs, signal);
          } catch (sleepError) {
            return {
              settled: false,
              failureClass: classifySettlementWriteFailure(sleepError, signal),
              error: sleepError,
              attempts,
            };
          }
        }
      }
    }
  }
}

/**
 * Execute a persistence step and return its value, or invoke `onFailure` and throw
 * the underlying error without wrapping it.
 */
export async function requireSettledWrite<T>(
  operation: () => Promise<T>,
  options: SettlementWriteOptions<T> = {},
  onFailure?: (failure: FailedSettlementOutcome) => void,
): Promise<T> {
  const outcome = await settleWriteWithVerification(operation, options);
  if (!outcome.settled) {
    onFailure?.(outcome);
    throw outcome.error;
  }
  return outcome.value;
}

function defaultSleep(ms: number, signal?: AbortSignal): Promise<void> {
  return delay(ms, { signal });
}

function collectErrorChain(error: unknown): unknown[] {
  const chain: unknown[] = [];
  const seen = new Set<unknown>();
  let current: unknown = error;
  for (
    let depth = 0;
    depth < MAX_CAUSE_DEPTH && current !== undefined && current !== null;
    depth++
  ) {
    if (seen.has(current)) break;
    seen.add(current);
    chain.push(current);
    if (typeof current === 'object' && 'cause' in current) {
      current = (current as { cause?: unknown }).cause;
    } else {
      break;
    }
  }
  return chain;
}

function readStringProperty(value: unknown, key: 'name' | 'code'): string | undefined {
  if (typeof value !== 'object' || value === null || !(key in value)) {
    return undefined;
  }
  const prop = (value as Record<string, unknown>)[key];
  return typeof prop === 'string' ? prop : undefined;
}

function readErrorMessage(value: unknown): string {
  if (value instanceof Error) return value.message;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && 'message' in value) {
    const message = (value as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return String(value);
}
