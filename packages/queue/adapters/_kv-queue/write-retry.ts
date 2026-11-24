/**
 * Bounded transient retry and commit-outcome classification for local Deno KV writes.
 *
 * Retries only failures known to be uncommitted local SQLite lock/busy contention.
 * Refused CAS preconditions remain conflicts and are never retried as transient.
 * Unknown commit outcomes never trigger a blind replay; callers supply read-only
 * state verification to check whether the write already committed before deciding.
 *
 * @module
 */

import { delay } from '@std/async/delay';
import type { MessageEnvelope } from '../_envelope.ts';

const REQUEUE_MARKER_PREFIX = 'queue:requeue';
const REQUEUE_MARKER_TTL_MS = 24 * 60 * 60_000;

/** Closed classification for failed local KV write attempts. */
export const WRITE_FAILURE_CLASS = {
  CAS_CONFLICT: 'cas_conflict',
  KNOWN_UNCOMMITTED_TRANSIENT: 'known_uncommitted_transient',
  ABORTED: 'aborted',
  UNKNOWN_COMMIT_OUTCOME: 'unknown_commit_outcome',
} as const;

/** Discriminated classification union for local KV write failures. */
export type WriteFailureClass = typeof WRITE_FAILURE_CLASS[keyof typeof WRITE_FAILURE_CLASS];

/** Bounded retry policy for known-uncommitted transient SQLite contention. */
export interface KvWriteRetryPolicy {
  /** Maximum total attempts including the initial attempt (must be >= 1). */
  readonly maxAttempts: number;
  /**
   * Monotonic retry-start deadline in milliseconds from the initial attempt start.
   * No retry begins at or after `start + maxTotalTimeMs`; an already-started backing
   * write runs to completion unless the operation itself supports cancellation.
   */
  readonly maxTotalTimeMs: number;
  /** Base exponential backoff delay before the first retry in milliseconds. */
  readonly baseDelayMs: number;
  /** Maximum single backoff wait in milliseconds. */
  readonly maxDelayMs: number;
}

/**
 * Default bounded retry policy for local file-backed Deno KV contention.
 *
 * Allows up to 6 attempts (1 initial + 5 retries) within a 2 s ceiling using
 * equal-jitter exponential backoff (15 -> 30 -> 60 -> 120 -> 240 ms, capped at 250 ms).
 */
export const DEFAULT_KV_WRITE_RETRY_POLICY: KvWriteRetryPolicy = Object.freeze({
  maxAttempts: 6,
  maxTotalTimeMs: 2_000,
  baseDelayMs: 15,
  maxDelayMs: 250,
});

/** Result returned by a read-only post-error commit verification callback. */
export type CommitVerificationResult<T> =
  | Readonly<{ committed: true; value: T }>
  | Readonly<{ committed: false }>;

/** Options for {@link retryKnownUncommittedWrite}. */
export interface KvWriteRetryOptions<T> {
  /** Bounded retry policy; defaults to {@link DEFAULT_KV_WRITE_RETRY_POLICY}. */
  readonly policy?: KvWriteRetryPolicy;
  /** Abort signal that cancels retries and backoff waits immediately. */
  readonly signal?: AbortSignal;
  /** Optional read-only state verifier invoked on `unknown_commit_outcome`. */
  readonly verifyCommitted?: () => Promise<CommitVerificationResult<T>>;
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
  /\b(?:ambiguous|uncertain|commit outcome|outcome unknown|after commit)\b/i;
const SQLITE_CODE_PREFIX_PATTERN = /^SQLITE_[A-Z0-9_]+$/i;
const SQLITE_ANY_MESSAGE_CODE_PATTERN = /\bSQLITE_[A-Z0-9_]+\b/gi;
const SQLITE_TRANSIENT_CODE_PATTERN = /^SQLITE_(?:BUSY|LOCKED)(?:_[A-Z0-9_]+)?$/i;
const SQLITE_TRANSIENT_MESSAGE_PATTERN =
  /\b(?:SQLITE_BUSY(?:_[A-Z0-9_]+)?|SQLITE_LOCKED(?:_[A-Z0-9_]+)?|database is locked|database table is locked|database schema is locked)\b/i;

/**
 * Classify a write failure into the closed commit-outcome taxonomy.
 *
 * CAS refusals, aborts, explicit non-busy SQLite codes (including extended I/O codes),
 * closed resources, and ambiguous failures always take precedence over transient SQLite
 * busy message matching so they can never be misclassified as safe-to-retry.
 */
export function classifyKvWriteFailure(
  error: unknown,
  signal?: AbortSignal,
): WriteFailureClass {
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
      return WRITE_FAILURE_CLASS.CAS_CONFLICT;
    }

    if (
      (name !== undefined && ABORT_ERROR_NAMES.has(name)) ||
      (signal?.aborted && item === signal.reason)
    ) {
      return WRITE_FAILURE_CLASS.ABORTED;
    }

    if (
      item instanceof Deno.errors.BadResource ||
      name === 'KvClosedError' ||
      hasExplicitNonBusySqliteCode(code, message) ||
      AMBIGUOUS_OR_NON_TRANSIENT_PATTERN.test(message)
    ) {
      return WRITE_FAILURE_CLASS.UNKNOWN_COMMIT_OUTCOME;
    }

    if (
      (code !== undefined && SQLITE_TRANSIENT_CODE_PATTERN.test(code)) ||
      SQLITE_TRANSIENT_MESSAGE_PATTERN.test(message)
    ) {
      hasTransientBusy = true;
    }
  }

  return hasTransientBusy
    ? WRITE_FAILURE_CLASS.KNOWN_UNCOMMITTED_TRANSIENT
    : WRITE_FAILURE_CLASS.UNKNOWN_COMMIT_OUTCOME;
}

/**
 * Execute a KV write with bounded jittered retries only for known-uncommitted
 * transient SQLite busy/locked contention, and read-first verification on unknown
 * commit outcomes. `policy.maxTotalTimeMs` is enforced as a monotonic retry-start
 * deadline checked before and after backoff; no retry starts at or after the deadline.
 */
export async function retryKnownUncommittedWrite<T>(
  operation: () => Promise<T>,
  options: KvWriteRetryOptions<T> = {},
): Promise<T> {
  const policy = options.policy ?? DEFAULT_KV_WRITE_RETRY_POLICY;
  const now = options.now ?? (() => performance.now());
  const random = options.random ?? Math.random;
  const sleep = options.sleep ?? defaultSleep;
  const signal = options.signal;
  const deadline = now() + Math.max(0, policy.maxTotalTimeMs);
  const maxAttempts = Math.max(1, Math.floor(policy.maxAttempts));

  let attempt = 0;
  while (true) {
    signal?.throwIfAborted();
    attempt += 1;
    try {
      return await operation();
    } catch (error) {
      const failureClass = classifyKvWriteFailure(error, signal);
      if (
        failureClass === WRITE_FAILURE_CLASS.UNKNOWN_COMMIT_OUTCOME &&
        options.verifyCommitted
      ) {
        try {
          const verified = await options.verifyCommitted();
          if (verified.committed) {
            return verified.value;
          }
        } catch {
          // Verification could not prove a committed state; preserve the original error.
        }
        throw error;
      }

      if (
        failureClass !== WRITE_FAILURE_CLASS.KNOWN_UNCOMMITTED_TRANSIENT ||
        attempt >= maxAttempts ||
        signal?.aborted
      ) {
        throw error;
      }

      const remainingMs = deadline - now();
      if (remainingMs <= 0) {
        throw error;
      }

      const ceiling = Math.min(policy.maxDelayMs, policy.baseDelayMs * 2 ** (attempt - 1));
      if (ceiling > 0) {
        const jitterFactor = Math.min(1, Math.max(0, random()));
        const jittered = Math.max(1, Math.floor(ceiling / 2 + jitterFactor * (ceiling / 2)));
        if (jittered >= remainingMs) {
          throw error;
        }
        await sleep(jittered, signal);
        signal?.throwIfAborted();
        if (now() >= deadline) {
          throw error;
        }
      }
    }
  }
}

function hasExplicitNonBusySqliteCode(code: string | undefined, message: string): boolean {
  if (
    code !== undefined &&
    SQLITE_CODE_PREFIX_PATTERN.test(code) &&
    !SQLITE_TRANSIENT_CODE_PATTERN.test(code)
  ) {
    return true;
  }
  const tokens = message.match(SQLITE_ANY_MESSAGE_CODE_PATTERN);
  if (!tokens) return false;
  return tokens.some((token) => !SQLITE_TRANSIENT_CODE_PATTERN.test(token));
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

/** Check whether a requeue for `(queueName, messageId, sourceEpoch)` already committed. */
export async function isKvRequeueCommitted(
  kv: Deno.Kv,
  queueName: string,
  messageId: string,
  sourceEpoch: number,
): Promise<boolean> {
  const entry = await kv.get([REQUEUE_MARKER_PREFIX, queueName, messageId, sourceEpoch]);
  return entry.value !== null;
}

/**
 * Atomically record a stable requeue marker and enqueue `next` in one KV transaction.
 *
 * Retries known-uncommitted SQLite busy contention within the bounded policy, treats
 * CAS refusal (`{ ok: false }`) as an already-settled conflict without retry, and verifies
 * the marker key read-only on unknown commit outcomes instead of blindly replaying.
 */
export async function requeueKvEnvelopeAtomically(
  kv: Deno.Kv,
  source: MessageEnvelope<unknown> & { queueName: string },
  next: MessageEnvelope<unknown> & { queueName: string },
  delayMs?: number,
): Promise<void> {
  const sourceEpoch = source.requeueEpoch ?? 0;
  const markerKey: Deno.KvKey = [
    REQUEUE_MARKER_PREFIX,
    source.queueName,
    source.messageId,
    sourceEpoch,
  ];
  const nextEnvelope = { ...next, requeueEpoch: sourceEpoch + 1 };
  const enqueueOptions = delayMs ? { delay: delayMs } : undefined;
  await retryKnownUncommittedWrite(
    () =>
      kv.atomic()
        .check({ key: markerKey, versionstamp: null })
        .set(
          markerKey,
          { nextEpoch: sourceEpoch + 1, deliveryCount: nextEnvelope.deliveryCount },
          { expireIn: REQUEUE_MARKER_TTL_MS },
        )
        .enqueue(nextEnvelope, enqueueOptions)
        .commit(),
    {
      verifyCommitted: async () => {
        const existing = await kv.get(markerKey);
        if (existing.value !== null) {
          return {
            committed: true,
            value: { ok: true as const, versionstamp: existing.versionstamp },
          };
        }
        return { committed: false };
      },
    },
  );
}
